window.addEventListener('load',async function(){
    let start = new Date().valueOf();
    let table = document.createElement('table');
    document.body.appendChild(table);
    let saves_array = (await storageapi.get({saves: []})).saves;
    document.getElementById('tabcount').innerText = saves_array.length;
    for (const save of saves_array) {
        let tr = document.createElement('tr');
        let date_td = document.createElement('td');
        let title_td = document.createElement('td');
        let link_td = document.createElement('td');

        date_td.innerText = new Date(save.date).toISOString();
        let title_link = document.createElement('a');
        title_link.setAttribute('href',save.url);
        title_link.innerText = save.title;
        title_td.appendChild(title_link);
        let link_link = document.createElement('a');
        link_link.setAttribute('href',save.url);
        link_link.innerText = save.url;
        link_td.appendChild(link_link);

        tr.appendChild(date_td);
        tr.appendChild(title_td);
        tr.appendChild(link_td);
        table.appendChild(tr);
    }

    document.body.removeChild(document.getElementById('loading-marker'));
    console.log("render took " + (new Date().valueOf() - start) + " ms");
});
