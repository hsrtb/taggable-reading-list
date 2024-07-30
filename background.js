const storageapi = browser.storage.local;
async function save_tabs() {
    let tab_array = await browser.tabs.query({currentWindow:true});
    let saves_array = (await storageapi.get({saves: []})).saves;
    let ids = []
    for (const tab of tab_array) {
        console.log(tab.title + " - " + tab.url);
        saves_array.push({url: tab.url, title: tab.title, date: new Date().valueOf()});
        ids.push(tab.id);
    }
    await storageapi.set({saves:saves_array});
    browser.tabs.remove(ids);
}
browser.action.onClicked.addListener(save_tabs);
async function show_tabs() {
    let saves_array = (await storageapi.get({saves: []})).saves;
    for (const save of saves_array) {
        console.log(new Date(save.date).toISOString() + " || " + save.title + " || " + save.url);
    }
}
