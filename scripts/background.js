const local = {
    get: key => new Promise(resolve => {
        chrome.storage.local.get(key)
            .then(result => resolve(result[key]));
    }),
    set: (key, data) => new Promise(async resolve => {
        let json = {};
        json[key] = data;

        await chrome.storage.local.set(json);
        resolve();
    }),
}

const updateValues = () => new Promise(resolve => {
    fetch('https://ollie.fund/api/itemdetails', {
        headers: {
            'user-agent': 'ollie.fund extension!'
        },
        cors: 'no-cors'
    })
    .then(async resp => {
        let json;
        try { json = await resp.json() }
        catch (e) {
            console.error(e);
            return resolve();
        }

        local.set('items', json);
        resolve();
    })
    .catch(err => {
        console.error(err);
        return resolve();
    })
})

const getItemValues = () => local.get('items');
const getItem = async id => {
    const values = await getItemValues();
    return values[id] || null;
}

const main = async () => {
    await updateValues();
    setInterval(updateValues, 90 * 1000);

    const values = await local.get('items');
    console.log(values);

    console.log(
        await getItem(151784526)
    )
}

main();

