async function on_tablink_click(e) {
    let start = new Date().valueOf();
    e.preventDefault();
    let taburl = e.target.href;
    let tr = e.target.parentElement.parentElement;
    let next_tr = tr.nextElementSibling;
    let index = parseInt(tr.firstChild.innerText) - 1;
    console.log(taburl);
    let saves_array = (await storageapi.get({saves: []})).saves;
    saves_array.splice(index,1);
    storageapi.set({saves: saves_array});
    tr.parentElement.removeChild(tr);
    browser.tabs.create({url: taburl});
    document.getElementById('tabcount').innerText = saves_array.length;
    let start_loop = new Date().valueOf();
    while (next_tr) {
        let idx = parseInt(next_tr.firstChild.innerText);
        next_tr.firstChild.innerText = idx - 1;
        next_tr = next_tr.nextElementSibling;
    }
    let end = new Date().valueOf();
    console.log('total: ' + (end - start) + " ms\nloop: " + (end - start_loop) + " ms");
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
    for (let i = 0; i < saves_array.length; ++i) {
        const save = saves_array[i];
        let tr = document.createElement('tr');
        let number_td = document.createElement('td');
        let date_td = document.createElement('td');
        let title_td = document.createElement('td');
        let link_td = document.createElement('td');

        number_td.innerText = i + 1;
        number_td.setAttribute('class', 'entrynumber');
        date_td.innerText = new Date(save.date).toISOString();
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

        tr.appendChild(number_td);
        tr.appendChild(date_td);
        tr.appendChild(title_td);
        tr.appendChild(link_td);
        table.appendChild(tr);
    }

    document.body.removeChild(document.getElementById('loading-marker'));
    console.log("render took " + (new Date().valueOf() - start) + " ms");
});
