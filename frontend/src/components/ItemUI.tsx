import React, { useState } from 'react';
import { buildPath } from './Path.ts';

function ItemUI() {

    let _ud: any = localStorage.getItem('user_data');
    let ud = JSON.parse(_ud);
    let userId: string = ud.id;
    const [message, setMessage] = useState('');
    const [searchResults, setResults] = useState('');
    const [itemList, setItemList] = useState('');
    const [search, setSearchValue] = React.useState('');
    const [item, setItemNameValue] = React.useState('');

    async function addItem(e: any): Promise<void> {
        e.preventDefault();
        let obj = { userId: userId, item: item };
        let js = JSON.stringify(obj);
        try {
            const response = await fetch(buildPath('api/addItem'),
                {
                    method: 'POST', body: js, headers: {
                        'Content-Type':
                            'application/json'
                    }
                });
            let txt = await response.text();
            let res = JSON.parse(txt);
            if (res.error.length > 0) {
                setMessage("API Error:" + res.error);
            }
            else {
                setMessage('Item has been added');
            }
        }
        catch (error: any) {
            setMessage(error.toString());
        }
    };
    async function searchItem(e: any): Promise<void> {
        e.preventDefault();
        let obj = { userId: userId, search: search };
        let js = JSON.stringify(obj);
        try {
            const response = await fetch(buildPath('api/searchItems'),
                {
                    method: 'POST', body: js, headers: {
                        'Content-Type':
                            'application/json'
                    }
                });
            let txt = await response.text();
            let res = JSON.parse(txt);
            let _results = res.results;
            let resultText = '';
            for (let i = 0; i < _results.length; i++) {
                resultText += _results[i];
                if (i < _results.length - 1) {
                    resultText += ', ';
                }
            }
            setResults('Item(s) have been retrieved');
            setItemList(resultText);
        }
        catch (error: any) {
            alert(error.toString());
            setResults(error.toString());
        }
    };
    function handleSearchTextChange(e: any): void {
        setSearchValue(e.target.value);
    }
    function handleItemTextChange(e: any): void {
        setItemNameValue(e.target.value);
    }
    return (
        <div id="itemUIDiv">
            <br />
            Search: <input type="text" id="searchText" placeholder="Item To Search For"
                onChange={handleSearchTextChange} />
            <button type="button" id="searchItemButton" className="buttons"
                onClick={searchItem}> Search Item</button><br />
            <span id="itemSearchResult">{searchResults}</span>
            <p id="itemList">{itemList}</p><br /><br />
            Add: <input type="text" id="itemText" placeholder="Item To Add"
                onChange={handleItemTextChange} />
            <button type="button" id="addItemButton" className="buttons"
                onClick={addItem}> Add Item </button><br />
            <span id="itemAddResult">{message}</span>
        </div>
    );
}
export default ItemUI;