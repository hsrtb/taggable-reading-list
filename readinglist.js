async function on_tablink_click(e) {
    e.preventDefault();
    let taburl = e.target.href;
    let tr = e.target.parentElement.parentElement;
    if (e.shiftKey) browser.windows.create({url: taburl});
    else browser.tabs.create({url: taburl});
    await delete_entry(tr);
}
async function on_delete_click(e) {
    let tr = e.currentTarget.parentElement;
    await delete_entry(tr);
}
async function delete_entry(tr) {
    let start = new Date().valueOf();
    let next_tr = tr.nextElementSibling;
    if (tr.getAttribute('class') == 'firstinblock' && next_tr) next_tr.setAttribute('class', 'firstinblock');
    let index = parseInt(tr.firstChild.nextElementSibling.innerText) - 1;
    let saves_array = (await storageapi.get({saves: []})).saves;
    console.log(saves_array.splice(index,1)[0].url);
    storageapi.set({saves: saves_array});
    tr.parentElement.removeChild(tr);
    document.getElementById('tabcount').innerText = saves_array.length;
    while (next_tr) {
        let idx = parseInt(next_tr.firstChild.nextElementSibling.innerText);
        next_tr.firstChild.nextElementSibling.innerText = idx - 1;
        next_tr = next_tr.nextElementSibling;
    }
    let end = new Date().valueOf();
    console.log('delete took ' + (end - start) + " ms");
}
window.addEventListener('load',async function(){
    // ensure only one instance of this page is ever loaded
    let readinglist_pages = await browser.tabs.query({url: window.location.href});
    if (readinglist_pages.length != 1) {
        if (readinglist_pages.length != 2) {
            document.body.innerHTML = '<p style=\'color:red; font-size: 3em;\'>Hit unreachable state: more than 2 reading list pages open</p>';
            return;
        }
        let first_page = readinglist_pages.shift();
        await browser.tabs.highlight({tabs: [first_page.index], windowId: first_page.windowId});
        await browser.windows.update(first_page.windowId, {focused: true});
        // no need to reload that tab because this one cannot have modified the database yet
        await browser.tabs.remove((await browser.tabs.getCurrent()).id);
    }

    let start = new Date().valueOf();
    let table = document.createElement('table');
    document.body.appendChild(table);
    let saves_array = (await storageapi.get({saves: []})).saves;
    document.getElementById('tabcount').innerText = saves_array.length;
    let last_date = null;
    for (let i = 0; i < saves_array.length; ++i) {
        const save = saves_array[i];
        let tr = document.createElement('tr');
        let delete_td = document.createElement('td');
        let number_td = document.createElement('td');
        let date_td = document.createElement('td');
        let favicon_td = document.createElement('td');
        let title_td = document.createElement('td');
        let link_td = document.createElement('td');

        if (i > 0 && save.date != last_date) tr.setAttribute('class', 'firstinblock');
        last_date = save.date;

        delete_td.setAttribute('class','deletebutton');
        delete_td.innerHTML = "<svg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg' width='10' height='10'>\n" +
                              "<defs><style>.b {stroke: #bbb; stroke-linecap: round; stroke-width: 18px}</style></defs>\n" +
                              "<line class='b' x1='9' y1='9' x2='91' y2='91'/>\n" +
                              "<line class='b' x1='9' y1='91' x2='91' y2='9'/>\n" +
                              "</svg>";
        delete_td.addEventListener('click',on_delete_click);
        number_td.innerText = i + 1;
        number_td.setAttribute('class', 'entrynumber');
        date_td.innerText = new Date(save.date).toISOString();
        let favicon = document.createElement('img');
        favicon.src = 'https://www.google.com/s2/favicons?sz=16&domain=' + new URL(save.url).hostname;
        favicon_td.appendChild(favicon);
        let title_link = document.createElement('a');
        title_link.setAttribute('href',save.url);
        title_link.innerText = save.title;
        title_link.addEventListener('click',on_tablink_click);
        title_td.appendChild(title_link);
        let link_link = document.createElement('a');
        link_link.setAttribute('href',save.url);
        link_link.innerText = save.url;
        link_link.addEventListener('click',on_tablink_click);
        link_td.appendChild(link_link);

        tr.appendChild(delete_td);
        tr.appendChild(number_td);
        tr.appendChild(date_td);
        tr.appendChild(favicon_td);
        tr.appendChild(title_td);
        tr.appendChild(link_td);
        table.appendChild(tr);
    }

    document.body.removeChild(document.getElementById('loading-marker'));
    console.log("render took " + (new Date().valueOf() - start) + " ms");
});
