const readinglist_page_url = browser.runtime.getURL("readinglist.html");

async function show_list() {
    let readinglist_page = (await browser.tabs.query({url: readinglist_page_url}))[0];
    if (readinglist_page) {
        await browser.tabs.highlight({tabs: [readinglist_page.index], windowId: readinglist_page.windowId});
        await browser.windows.update(readinglist_page.windowId, {focused: true});
        return [readinglist_page, false];
    } else return [(await browser.windows.create({url: "readinglist.html"})).tabs[0], true];
}
async function save_tabs() {
    let start = new Date().valueOf();
    let tab_array = await browser.tabs.query({currentWindow:true});
    let saves_array = (await storageapi.get({saves: []})).saves;
    let new_saves_array = [];
    let ids = [];
    for (const tab of tab_array) {
        if (tab.url == readinglist_page_url) continue;
        if (tab.url == 'chrome://browser/content/blanktab.html' || tab.url == 'about:newtab') {
            ids.push(tab.id); // still want to close a blank tab, just not add it to the list
            continue;
        }
        new_saves_array.push({url: tab.url, title: tab.title, date: 1000 * Math.round(new Date().valueOf() / 1000)});
        ids.push(tab.id);
    }
    await storageapi.set({saves:new_saves_array.concat(saves_array)});

    let starttabstuff = new Date().valueOf();
    await browser.tabs.remove(ids);
    let [readinglist_page, was_created] = await show_list();
    let end = new Date().valueOf();
    let console_message = `background processing took ${end - start} ms total, ${end - starttabstuff} ms to close tabs and open list`;
    if (!was_created) browser.tabs.sendMessage(readinglist_page.id, {msg: console_message, new_tabs: new_saves_array});
    else browser.runtime.onMessage.addListener(function listener() {
        browser.tabs.sendMessage(readinglist_page.id, {msg: console_message});
        browser.runtime.onMessage.removeListener(listener);
    });
}
browser.action.onClicked.addListener(save_tabs);
browser.commands.onCommand.addListener(async function(command) {
    if (command == 'show-list') await show_list();
});
