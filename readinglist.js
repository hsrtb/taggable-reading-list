const storageapi = browser.storage.local;

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
    let index = parseInt(tr.children[1].innerText) - 1;
    let saves_array = (await storageapi.get({saves: []})).saves;
    console.log('deleted ', JSON.stringify(saves_array.splice(index, 1)[0]));
    storageapi.set({saves: saves_array});
    let table = tr.parentElement;
    let header_div = table.previousElementSibling;
    let header_tabcount = header_div.firstElementChild;
    tr.remove();
    document.getElementById('tabcount').innerText = saves_array.length;
    let new_header_tabcount = parseInt(header_tabcount.innerText) - 1;
    header_tabcount.innerText = parseInt(header_tabcount.innerText) - 1;
    if (new_header_tabcount === 0) {
        header_div.remove();
        table.remove();
    }
    let match_span = header_div.getElementsByClassName('match-span')[0];
    if (match_span.style.display === '') {
        let match_count_span = header_div.getElementsByClassName('filter-count-span')[0];
        let new_match_count = parseInt(match_count_span.innerText) - 1;
        if (new_match_count === 0) header_div.style.display = 'none';
        else match_count_span.innerText = new_match_count;
    }
    if (document.getElementById('match-header').style.display === '') {
        let match_count_element = document.getElementById('match-count');
        match_count_element.innerText = parseInt(match_count_element.innerText) - 1;
    }
    console.time('number-update');
    let trs = document.getElementById('tablist-div').getElementsByTagName('tr');
    // i = index because the original tr has been removed, so it does not show up in trs
    for (let i = index; i < trs.length; ++i) {
        let tr = trs[i];
        let before_num = parseInt(tr.children[1].innerText);
        tr.children[1].innerText = before_num - 1;
    }
    console.timeEnd('number-update');
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
    let index = parseInt(title_td.parentElement.children[1].innerText) - 1;
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
    save_button.innerHTML = 'save&nbsp;title';
    save_button.addEventListener('click', on_save_title_click);
    edit_button.parentElement.appendChild(save_button);
    edit_button.style.display = 'none';
    input.type = 'text';
    input.value = link.innerText;
    input.addEventListener('input', e => e.target.size = e.target.value.length + 1);
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
        pre.addEventListener('click', on_tag_click);
        tags_td.appendChild(pre);
    }
    let saves_array = (await storageapi.get({saves: []})).saves;
    let index = parseInt(tags_td.parentElement.children[1].innerText) - 1;
    saves_array[index].tags = tags;
    await storageapi.set({saves: saves_array});
    save_button.parentElement.removeChild(save_button);
    edit_button.style.display = '';
}
async function on_edit_tags_click(e) {
    let edit_button = e.currentTarget;
    let tags_td = edit_button.parentElement.previousElementSibling;
    let index = parseInt(tags_td.parentElement.children[1].innerText) - 1;
    let saves_array = (await storageapi.get({saves: []})).saves;
    let tags_array = saves_array[index].tags;
    let tags_string = tags_array ? tags_array.join(';') : '';
    let input = document.createElement('input');
    input.type = 'text';
    input.placeholder = 'semicolon-separated tags';
    input.value = tags_string;
    input.addEventListener('input', e => e.target.size = e.target.value.length + 1);
    input.style.fontFamily = 'monospace';
    let save_button = document.createElement('button');
    save_button.innerHTML = 'save&nbsp;tags';
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
    return `${date.getFullYear()}-${zero_pad(date.getMonth()+1)}-${zero_pad(date.getDate())}\u00a0${zero_pad(date.getHours())}${zero_pad(date.getMinutes())}${zero_pad(date.getSeconds())}`;
}
function format_date_long(date_msecs) {
    let date = new Date(date_msecs);
    let days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    let months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    let timestr = date.toTimeString();
    return `${days[date.getDay()]} ${zero_pad(date.getDate())} ${months[date.getMonth()]} ${date.getFullYear()} ${timestr.slice(0,9)}${timestr.slice(12)}`
}
async function do_filter_on_tag(selected_tag) {
    let start = new Date().valueOf();
    let saves = (await storageapi.get({saves: []})).saves;
    if (saves.length === 0) {
        console.log('do_filter_on_tag: 0 tabs');
        return;
    }
    let tablist_div = document.getElementById('tablist-div');
    let global_n_matches = 0;
    let idx = 0;
    for (let block = 0, n_blocks = tablist_div.children.length / 2; block < n_blocks; ++block) {
        let current_header_div = tablist_div.children[block * 2];
        let current_table = tablist_div.children[block * 2 + 1];
        let block_n_matches = 0;
        let ntabs = current_table.children.length;
        for (let i = 0; i < ntabs; ++i) {
            let match = false;
            if (saves[idx + i].tags) for (const tag of saves[idx + i].tags) {
                if (tag === selected_tag || tag.startsWith(selected_tag + '/')) {
                    match = true;
                    break;
                }
            }
            let tr = current_table.children[i];
            if (match) {
                tr.style.display = '';
                block_n_matches++;
            } else tr.style.display = 'none';
        }
        let match_span = current_header_div.getElementsByClassName('match-span')[0];
        let match_count_span = current_header_div.getElementsByClassName('filter-count-span')[0];
        let tag_span = current_header_div.getElementsByClassName('filter-tag-span')[0];
        match_count_span.innerText = block_n_matches;
        tag_span.innerText = selected_tag;
        match_span.style.display = '';

        if (block_n_matches === 0) current_header_div.style.display = 'none';
        else current_header_div.style.display = '';

        idx += ntabs;
        global_n_matches += block_n_matches
    }

    document.getElementById('clear-filter').style.display = '';
    document.getElementById('filter-tag').innerText = selected_tag;
    document.getElementById('match-count').innerText = global_n_matches;
    document.getElementById('match-header').style.display = '';
    console.log('filter on tag',selected_tag,'took',new Date().valueOf() - start,'ms');
}
async function do_clear_filter() {
    console.time('clear-filter');
    let tablist_div = document.getElementById('tablist-div');
    for (let block = 0, n_blocks = tablist_div.children.length / 2; block < n_blocks; ++block) {
        let current_header_div = tablist_div.children[block * 2];
        let current_table = tablist_div.children[block * 2 + 1];
        for (let tr of current_table.children) tr.style.display = '';
        current_header_div.getElementsByClassName('match-span')[0].style.display = 'none';
        current_header_div.style.display = '';
    }
    document.getElementById('clear-filter').style.display = 'none';
    document.getElementById('match-header').style.display = 'none';
    console.timeEnd('clear-filter');
}
async function on_tag_click(e) {
    await do_filter_on_tag(e.currentTarget.innerText);
}
async function do_toggle_urls() {
    let button = document.getElementById('show-hide-urls');
    if (button.innerText === 'Hide URLs') {
        let sheet = new CSSStyleSheet();
        await sheet.replace('.url { display: none }');
        document.adoptedStyleSheets = [sheet];
        button.innerText = 'Show URLs';
    } else {
        document.adoptedStyleSheets = [];
        button.innerText = 'Hide URLs';
    }
}
function generate_tr(save, idx) {
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

    delete_td.setAttribute('class','deletebutton');
    let img = document.createElement('img');
    img.src = 'icons/x.svg';
    delete_td.append(img);
    delete_td.addEventListener('click',on_delete_click);
    number_td.innerText = idx + 1;
    number_td.setAttribute('class', 'entrynumber');
    let date_span = document.createElement('span');
    date_span.setAttribute('title', format_date_long(save.date));
    date_span.innerText = format_date(save.date);
    date_td.append(date_span);
    let favicon = document.createElement('img');
    favicon.src = 'https://t3.gstatic.com/faviconV2?client=SOCIAL&type=FAVICON&fallback_opts=TYPE,SIZE,URL&size=16&url=http://' + new URL(save.url).hostname;
    favicon_td.appendChild(favicon);
    let title_link = document.createElement('a');
    title_link.setAttribute('href',save.url);
    title_link.innerText = save.title;
    title_link.addEventListener('click',on_tablink_click);
    title_td.appendChild(title_link);
    let title_edit_button = document.createElement('button');
    title_edit_button.innerHTML = 'edit&nbsp;title';
    title_edit_button.addEventListener('click', on_edit_title_click);
    title_edit_button_td.appendChild(title_edit_button);
    if (save.tags) for (const tag of save.tags) {
        let pre = document.createElement('pre');
        pre.innerText = tag;
        pre.setAttribute('class', 'tag');
        pre.addEventListener('click', on_tag_click);
        tags_td.appendChild(pre);
    }
    let tags_edit_button = document.createElement('button');
    tags_edit_button.innerHTML = 'edit&nbsp;tags';
    tags_edit_button.addEventListener('click', on_edit_tags_click);
    tags_edit_button_td.appendChild(tags_edit_button);
    let link_link = document.createElement('a');
    link_link.setAttribute('href',save.url);
    link_link.innerText = save.url;
    link_link.addEventListener('click',on_tablink_click);
    link_td.appendChild(link_link);
    link_td.classList.add('url');

    tr.appendChild(delete_td);
    tr.appendChild(number_td);
    tr.appendChild(date_td);
    tr.appendChild(favicon_td);
    tr.appendChild(title_td);
    tr.appendChild(title_edit_button_td);
    tr.appendChild(tags_td);
    tr.appendChild(tags_edit_button_td);
    tr.appendChild(link_td);
    return tr;
}
// precondition: saves_array.length > start_idx
function generate_table(saves_array, start_idx) {
    let table = document.createElement('table');
    let block_date = saves_array[start_idx].date;
    for (let i = start_idx; ; ++i) {
        if (i === saves_array.length || saves_array[i].date !== block_date) {
            let div = document.createElement('div');
            div.classList.add('block-header');
            let span = document.createElement('span');
            span.classList.add('block-head-tabcount');
            span.innerText = table.childNodes.length;
            let match_span = document.createElement('span');
            match_span.style.display = 'none';
            match_span.setAttribute('class','match-span');
            let match_span_count_span = document.createElement('span');
            match_span_count_span.setAttribute('class', 'filter-count-span');
            let match_span_tag_span = document.createElement('span');
            match_span_tag_span.style.fontFamily = 'monospace';
            match_span_tag_span.setAttribute('class','filter-tag-span');
            match_span.append(", ", match_span_count_span, " ", match_span_tag_span);
            div.append(span, " tabs", match_span);
            return [div, table, i === saves_array.length ? null : i];
        }
        table.append(generate_tr(saves_array[i], i));
    }
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
    document.getElementById('clear-filter').addEventListener('click', do_clear_filter);
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
    document.getElementById('filter-on-tag').addEventListener('click', () => {
        do_filter_on_tag(document.getElementById('tag-input').value);
    });
    document.getElementById('show-hide-urls').addEventListener('click', do_toggle_urls);

    await do_toggle_urls();


    let start = new Date().valueOf();
    let tablist_body = document.getElementById('tablist');
    let tablist_div = document.createElement('div');
    tablist_div.id = 'tablist-div';
    let saves_array = (await storageapi.get({saves: []})).saves;
    if (saves_array.length === 0) {
        console.log('skipping render because saves_array.length === 0');
        document.getElementById('loading-marker').remove();
        document.getElementById('tabcount').innerText = 0;
        tablist_body.append(tablist_div); // tablist_div still needs to be there so that tabs can be added in the future
        return;
    }
    document.getElementById('tabcount').innerText = saves_array.length;
    console.time('generate_tr()');
    let div, table, next_idx = 0;
    while (next_idx !== null) {
        [div, table, next_idx] = generate_table(saves_array, next_idx);
        tablist_div.append(div, table);
    }
    console.timeEnd('generate_tr()');

    tablist_body.removeChild(document.getElementById('loading-marker'));
    console.time('tablist_body.appendChild()');
    tablist_body.appendChild(tablist_div);
    console.timeEnd('tablist_body.appendChild()');
    let elapsed_time = new Date().valueOf() - start;
    console.log("render took " + elapsed_time + " ms = " + (elapsed_time/saves_array.length).toFixed(2) + " ms per tab");
});
browser.runtime.onMessage.addListener((msg) => (async (message) => {
    console.log(message.msg);
    if (message.new_tabs && message.new_tabs.length !== 0) { // if all tabs are rejected as dupes background.js sends an empty array
        let start = new Date().valueOf();
        let [div, table, next_idx] = generate_table(message.new_tabs, 0);
        let tablist_div = document.getElementById('tablist-div');
        for (let tr of tablist_div.getElementsByTagName('tr')) {
            let before_num = parseInt(tr.children[1].innerText);
            tr.childNodes[1].innerText = before_num + message.new_tabs.length;
        }
        tablist_div.prepend(div, table);
        let tabcount = document.getElementById('tabcount');
        tabcount.innerText = parseInt(tabcount.innerText) + message.new_tabs.length;
        await do_clear_filter();

        let end = new Date().valueOf();
        console.log(`adding ${message.new_tabs.length} tabs took ${end-start} ms`);
    }
    if (message.dupes) alert('duplicates rejected, see console for details');
})(msg).catch(e => console.log(e))); // have to do this otherwise exceptions get messaged back to background.js
browser.runtime.sendMessage({}); // trigger background script to send its message containing the message to print in the console
