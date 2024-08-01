async function save_tabs() {
    let tab_array = await browser.tabs.query({currentWindow:true});
    let saves_array = (await storageapi.get({saves: []})).saves;
    let new_saves_array = [];
    let ids = [];
    for (const tab of tab_array) {
        console.log(tab.title + " - " + tab.url);
        new_saves_array.push({url: tab.url, title: tab.title, date: 1000 * Math.round(new Date().valueOf() / 1000)});
        ids.push(tab.id);
    }
    await storageapi.set({saves:new_saves_array.concat(saves_array)});
    browser.tabs.remove(ids);
    browser.windows.create({url: "readinglist.html"});
}
browser.action.onClicked.addListener(save_tabs);
