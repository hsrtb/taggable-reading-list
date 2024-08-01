const storageapi = browser.storage.local;

async function get_plaintext_tablist() {
    let saves_array = (await storageapi.get({saves: []})).saves;
    let string = '';
    for (const save of saves_array) string += new Date(save.date).toISOString() + " || " + save.title + " || " + save.url + '\n';
    return string;
}
async function show_tabs() {
    console.log(await get_plaintext_tablist());
}
