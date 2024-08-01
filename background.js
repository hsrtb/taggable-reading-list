async function save_tabs() {
    let tab_array = await browser.tabs.query({currentWindow:true});
    let saves_array = (await storageapi.get({saves: []})).saves;
    let new_saves_array = [];
    let ids = [];
    let readinglist_page_url = browser.runtime.getURL("readinglist.html");
    for (const tab of tab_array) {
        if (tab.url == readinglist_page_url) continue;
        console.log(tab.title + " - " + tab.url);
        new_saves_array.push({url: tab.url, title: tab.title, date: 1000 * Math.round(new Date().valueOf() / 1000)});
        ids.push(tab.id);
    }
    await storageapi.set({saves:new_saves_array.concat(saves_array)});

    await browser.tabs.remove(ids);
    let readinglist_page = (await browser.tabs.query({url: readinglist_page_url}))[0];
    if (readinglist_page) {
        await browser.tabs.highlight({tabs: [readinglist_page.index], windowId: readinglist_page.windowId});
        await browser.windows.update(readinglist_page.windowId, {focused: true});
        await browser.tabs.reload(readinglist_page.id);
    } else browser.windows.create({url: "readinglist.html"});
}
browser.action.onClicked.addListener(save_tabs);
