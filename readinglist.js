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
async function on_save_title_click(e) {
    let save_button = e.currentTarget;
    let edit_button = save_button.previousElementSibling;
    let title_td = edit_button.parentElement.previousElementSibling;
    let link = title_td.firstElementChild;
    let input = title_td.lastElementChild;
    let new_title = input.value;
    link.innerText = new_title;
    let index = parseInt(title_td.parentElement.firstElementChild.nextElementSibling.innerText) - 1;
    let saves_array = (await storageapi.get({saves: []})).saves;
    saves_array[index].title = new_title;
    await storageapi.set({saves: saves_array});
    title_td.removeChild(input);
    link.style.display = '';
    save_button.parentElement.removeChild(save_button);
    edit_button.style.display = '';
}
function on_edit_title_click(e) {
    let edit_button = e.currentTarget;
    let title_td = edit_button.parentElement.previousElementSibling;
    let link = title_td.firstElementChild;
    let input = document.createElement('input');
    let save_button = document.createElement('button');
    save_button.innerText = 'save title';
    save_button.addEventListener('click', on_save_title_click);
    edit_button.parentElement.appendChild(save_button);
    edit_button.style.display = 'none';
    input.type = 'text';
    input.value = link.innerText;
    input.size = input.value.length;
    input.addEventListener('input', e => e.target.size = e.target.value.length);
    title_td.appendChild(input);
    link.style.display = 'none';
    input.focus();
}
async function on_save_tags_click(e) {
    let save_button = e.currentTarget;
    let edit_button = save_button.previousElementSibling;
    let tags_td = edit_button.parentElement.previousElementSibling;
    let input = tags_td.firstElementChild;
    let tags = input.value.length != 0 ? input.value.split(';') : null;
    tags_td.innerHTML = '';
    if(tags) for (const tag of tags) {
        let pre = document.createElement('pre');
        pre.innerText = tag;
        pre.setAttribute('class', 'tag');
        tags_td.appendChild(pre);
    }
    let saves_array = (await storageapi.get({saves: []})).saves;
    let index = parseInt(tags_td.parentElement.firstElementChild.nextElementSibling.innerText) - 1;
    saves_array[index].tags = tags;
    await storageapi.set({saves: saves_array});
    save_button.parentElement.removeChild(save_button);
    edit_button.style.display = '';
}
async function on_edit_tags_click(e) {
    let edit_button = e.currentTarget;
    let tags_td = edit_button.parentElement.previousElementSibling;
    let index = parseInt(tags_td.parentElement.firstElementChild.nextElementSibling.innerText) - 1;
    let saves_array = (await storageapi.get({saves: []})).saves;
    let tags_array = saves_array[index].tags;
    let tags_string = tags_array ? tags_array.join(';') : '';
    let input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'semicolon-separated tags';
    input.value = tags_string;
    input.addEventListener('input', e => e.target.size = e.target.value.length);
    input.style.fontFamily = 'monospace';
    let save_button = document.createElement('button');
    save_button.innerText = 'save tags';
    save_button.addEventListener('click', on_save_tags_click);
    edit_button.parentElement.appendChild(save_button);
    edit_button.style.display = 'none';

    tags_td.innerHTML = '';
    tags_td.appendChild(input);
    input.focus();
}
function zero_pad(num) {
    return num.toString().padStart(2,'0');
}
function format_date(date_msecs) {
    let date = new Date(date_msecs);
    return `${date.getFullYear()}-${zero_pad(date.getMonth()+1)}-${zero_pad(date.getDate())} ${zero_pad(date.getHours())}${zero_pad(date.getMinutes())}${zero_pad(date.getSeconds())}`;
}
function format_date_long(date_msecs) {
    let date = new Date(date_msecs);
    let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let timestr = date.toTimeString();
    return `${days[date.getDay()]} ${zero_pad(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()} ${timestr.slice(0,9)}${timestr.slice(12)}`
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
        let title_edit_button_td = document.createElement('td');
        let tags_td = document.createElement('td');
        let tags_edit_button_td = document.createElement('td');
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
        date_td.innerHTML = `<span title='${format_date_long(save.date)}'>${format_date(save.date)}</span>`;
        let favicon = document.createElement('img');
        favicon.src = 'https://www.google.com/s2/favicons?sz=16&domain=' + new URL(save.url).hostname;
        favicon_td.appendChild(favicon);
        let title_link = document.createElement('a');
        title_link.setAttribute('href',save.url);
        title_link.innerText = save.title;
        title_link.addEventListener('click',on_tablink_click);
        title_td.appendChild(title_link);
        let title_edit_button = document.createElement('button');
        title_edit_button.innerText = 'edit title';
        title_edit_button.addEventListener('click', on_edit_title_click);
        title_edit_button_td.appendChild(title_edit_button);
        if (save.tags) for (const tag of save.tags) {
            let pre = document.createElement('pre');
            pre.innerText = tag;
            pre.setAttribute('class', 'tag');
            tags_td.appendChild(pre);
        }
        let tags_edit_button = document.createElement('button');
        tags_edit_button.innerText = 'edit tags';
        tags_edit_button.addEventListener('click', on_edit_tags_click);
        tags_edit_button_td.appendChild(tags_edit_button);
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
        tr.appendChild(title_edit_button_td);
        tr.appendChild(tags_td);
        tr.appendChild(tags_edit_button_td);
        tr.appendChild(link_td);
        table.appendChild(tr);
    }

    document.body.removeChild(document.getElementById('loading-marker'));
    console.log("render took " + (new Date().valueOf() - start) + " ms");
});
