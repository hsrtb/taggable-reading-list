const storageapi = browser.storage.local;

function is_dup(tab, saves_array) {
    for (let i = 0; i < saves_array.length; ++i) {
        if (tab.url === saves_array[i].url || tab.title == saves_array[i].title) {
            return {idx: i, url: saves_array[i].url, title: saves_array[i].title};
        }
    }
    return null;
}
