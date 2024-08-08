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
    let index = parseInt(tr.id);
    let saves_array = (await storageapi.get({saves: []})).saves;
    console.log(saves_array.splice(index,1)[0].url);
    storageapi.set({saves: saves_array});
    tr.parentElement.removeChild(tr);
    document.getElementById('tabcount').innerText = saves_array.length;
    while (next_tr) {
        let idx = parseInt(next_tr.id);
        next_tr.firstChild.nextElementSibling.innerText = (idx + 1) - 1; // next_tr.id is zero-based, so convert to 1-based, then decrement
        next_tr.id = idx - 1;
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
    let index = parseInt(title_td.parentElement.id);
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
    let tags = input.value.length != 0 ? [...new Set(input.value.split(';'))] : null; // set removes duplicates
    tags_td.innerHTML = '';
    if(tags) for (const tag of tags) {
        let pre = document.createElement('pre');
        pre.innerText = tag;
        pre.setAttribute('class', 'tag');
        tags_td.appendChild(pre);
    }
    let saves_array = (await storageapi.get({saves: []})).saves;
    let index = parseInt(tags_td.parentElement.id);
    saves_array[index].tags = tags;
    await storageapi.set({saves: saves_array});
    save_button.parentElement.removeChild(save_button);
    edit_button.style.display = '';
}
async function on_edit_tags_click(e) {
    let edit_button = e.currentTarget;
    let tags_td = edit_button.parentElement.previousElementSibling;
    let index = parseInt(tags_td.parentElement.id);
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
function on_import_click() {
    let tablist_body = document.getElementById('tablist');
    let import_area = document.getElementById('import');
    tablist_body.style.display = 'none';
    import_area.style.display = '';
}
async function on_export_click() {
    let tablist_body = document.getElementById('tablist');
    let export_area = document.getElementById('export');
    tablist_body.style.display = 'none';
    export_area.style.display = '';
    let exported_data_area = document.getElementById('exported-data');
    let saves = (await storageapi.get({saves: []})).saves;
    let string = JSON.stringify((await storageapi.get({saves: []})).saves);
    let size_report = document.getElementById('export-data-size');
    let size = new Blob([string]).size;
    size_report.innerText = `${saves.length} tabs, ${size} bytes = ${(size / saves.length).toFixed(0)} bytes per tab`;
    exported_data_area.innerText = string;
}
function parse_data_import(string) {
    let data;
    try {
        data = JSON.parse(string);
    } catch(e) {
        alert(e);
        return null;
    }
    if (!(data instanceof Array)) {
        alert("expected data to be an array");
        return null;
    }
    for (let i = 0; i < data.length; ++i) {
        let save = data[i];
        // apparently empty strings convert to false
        if (save.url === undefined || save.title === undefined || save.date === undefined) {
            alert("data entry missing one of required properties (url, title, date) (details in console)");
            console.log('missing url, title, or date at index',i,'of imported data on object',save);
            return null;
        }
    }
    return data;
}
async function on_import_add_click() {
    let textarea = document.getElementById('imported-data');
    let string = textarea.value;
    let data = parse_data_import(string);
    if (data == null) return;
    let new_data = data.concat((await storageapi.get({saves: []})).saves);
    new_data.sort((a, b) => b.date - a.date);
    await storageapi.set({saves: new_data});
    await browser.tabs.reload((await browser.tabs.getCurrent()).id);
}
async function on_import_replace_click() {
    let textarea = document.getElementById('imported-data');
    let string = textarea.value;
    if (!confirm("Delete all tabs and replace with data in text box?")) return;
    let data = parse_data_import(string);
    if (data == null) return;
    data.sort((a, b) => b.date - a.date);
    await storageapi.set({saves: data});
    await browser.tabs.reload((await browser.tabs.getCurrent()).id);
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

    document.getElementById('import-button').addEventListener('click', on_import_click);
    document.getElementById('export-button').addEventListener('click', on_export_click);
    document.getElementById('import-add').addEventListener('click', on_import_add_click);
    document.getElementById('import-replace').addEventListener('click', on_import_replace_click);
    document.getElementById('copy').addEventListener('click', () => {
        navigator.clipboard.writeText(document.getElementById('exported-data').value).then(() => alert('copied'),(e) => alert(e));
    });
    document.getElementById('back').addEventListener('click', () => {
        document.getElementById('export').style.display = 'none';
        document.getElementById('tablist').style.display = '';
    });
    document.getElementById('back-import').addEventListener('click', () => {
        document.getElementById('import').style.display = 'none';
        document.getElementById('tablist').style.display = '';
    });

    let start = new Date().valueOf();
    let tablist_body = document.getElementById('tablist');
    let table = document.createElement('table');
    tablist_body.appendChild(table);
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
        tr.id = i;
        table.appendChild(tr);
    }

    tablist_body.removeChild(document.getElementById('loading-marker'));
    let elapsed_time = new Date().valueOf() - start;
    console.log("render took " + elapsed_time + " ms = " + (elapsed_time/saves_array.length).toFixed(2) + " ms per tab");
});
