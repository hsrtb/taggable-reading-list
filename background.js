const readinglist_page_url = browser.runtime.getURL("readinglist.html");

async function show_list() {
    let readinglist_page = (await browser.tabs.query({url: readinglist_page_url}))[0];
    if (readinglist_page) {
        await browser.tabs.highlight({tabs: [readinglist_page.index], windowId: readinglist_page.windowId});
        await browser.windows.update(readinglist_page.windowId, {focused: true});
        return [readinglist_page, false];
    } else return [(await browser.windows.create({url: "readinglist.html"})).tabs[0], true];
}
function is_dup(tab, saves_array) {
    for (let i = 0; i < saves_array.length; ++i) {
        if (tab.url === saves_array[i].url || tab.title == saves_array[i].title) {
            return {idx: i, url: saves_array[i].url, title: saves_array[i].title};
        }
    }
    return null;
}
async function save_tabs() {
    let start = new Date().valueOf();
    let tab_array = await browser.tabs.query({currentWindow:true});
    let saves_array = (await storageapi.get({saves: []})).saves;
    let new_saves_array = [];
    let ids = [];
    let console_message = '';
    let rejected_dupes = false;
    let date = 1000 * Math.round(new Date().valueOf() / 1000);
    for (const tab of tab_array) {
        if (tab.url == readinglist_page_url) continue;
        let save_tab = true;
        let dup = null;
        if (tab.url == 'chrome://browser/content/blanktab.html' || tab.url == 'about:newtab') save_tab = false;
        else if (dup = is_dup(tab, saves_array)) {
            save_tab = false;
            rejected_dupes = true;
            console_message += `rejected ${tab.title} ${tab.url} as duplicate of old entry #${dup.idx + 1} ${dup.title} ${dup.url}\n\n`;
        } else if (dup = is_dup(tab, new_saves_array)) {
            save_tab = false;
            rejected_dupes = true;
            console_message += `rejected ${tab.title} ${tab.url} as duplicate of new entry #${dup.idx + 1} ${dup.title} ${dup.url}\n\n`;
        }
        if (save_tab) new_saves_array.push({url: tab.url, title: tab.title, date: date});
        ids.push(tab.id);// still want to close an unsaved tab, just not add it to the list
    }
    await storageapi.set({saves:new_saves_array.concat(saves_array)});

    let starttabstuff = new Date().valueOf();
    await browser.tabs.remove(ids);
    let [readinglist_page, was_created] = await show_list();
    let end = new Date().valueOf();
    console_message += `background processing took ${end - start} ms total, ${end - starttabstuff} ms to close tabs and open list`;
    if (!was_created) browser.tabs.sendMessage(readinglist_page.id, {msg: console_message, new_tabs: new_saves_array, dupes: rejected_dupes});
    else browser.runtime.onMessage.addListener(function listener() {
        browser.tabs.sendMessage(readinglist_page.id, {msg: console_message, dupes: rejected_dupes});
        browser.runtime.onMessage.removeListener(listener);
    });
}
browser.action.onClicked.addListener(save_tabs);
browser.commands.onCommand.addListener(async function(command) {
    if (command == 'show-list') await show_list();
    if (command == 'add-tabs') await save_tabs();
});
