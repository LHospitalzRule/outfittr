import React, { useState } from 'react';
import { buildPath } from './Path';
import { getAccessToken, storeAccessToken } from '../utils/session';

function ItemUI() {
    const [message, setMessage] = useState('');
    const [searchResults, setResults] = useState('');
    const [itemList, setItemList] = useState('');
    const [search, setSearchValue] = React.useState('');
    const [item, setItemNameValue] = React.useState('');

    async function addItem(e: any): Promise<void> {
        e.preventDefault();
        
        const token = getAccessToken();

        if (!token) {
            setMessage("You must be logged in to add items.");
            return;
        }

        const formData = new FormData();
        formData.append('name', item); 
        
        const fileInput = document.getElementById('itemImage') as HTMLInputElement;
        if (fileInput?.files?.[0]) {
            formData.append('image', fileInput.files[0]);
        }

        try {
            const response = await fetch(buildPath('api/additem'), { 
                method: 'POST', 
                headers: { Authorization: `Bearer ${token}` },
                body: formData
            });
            
            let res = await response.json();
            if (res.error) {
                setMessage("API Error:" + res.error);
            } else {
                setMessage('Item has been added');
                if (res.accessToken) {
                    storeAccessToken(res.accessToken);
                }
            }
        } catch (error: any) {
            setMessage(error.toString());
        }
    }

    async function searchItem(e: any): Promise<void> {
        e.preventDefault();
        const token = getAccessToken();
        if (!token) {
            setResults("You must be logged in to search items.");
            return;
        }

        var obj = { search: search };
        var js = JSON.stringify(obj);
        try {
            const response = await fetch(buildPath('api/searchitems'),
                { method: 'POST', body: js, headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` } });
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
            if (res.accessToken) {
                storeAccessToken(res.accessToken);
            }
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
            {/* --- SEARCH SECTION --- */}
            Search: <input type="text" id="searchText" placeholder="Item To Search For"
                onChange={handleSearchTextChange} />
            <button type="button" id="searchItemButton" className="buttons"
                onClick={searchItem}> Search Item</button><br />
            <span id="itemSearchResult">{searchResults}</span>
            <p id="itemList">{itemList}</p>
            
            <br /><br />
            <hr /> {/* Visual separator */}
            <h3>Add New Wardrobe Item</h3>

            {/* --- NEW IMAGE INPUT --- */}
            <div style={{ marginBottom: "10px" }}>
                <label htmlFor="itemImage" style={{ display: "block", marginBottom: "5px" }}>Upload Photo:</label>
                <input 
                    type="file" 
                    id="itemImage" 
                    accept="image/*" 
                    className="buttons"
                />
            </div>

            {/* --- EXISTING NAME INPUT --- */}
            Add Name: <input type="text" id="itemText" placeholder="Item Name (e.g. Blue Hoodie)"
                onChange={handleItemTextChange} />
            
            <button type="button" id="addItemButton" className="buttons"
                onClick={addItem}> Add Item </button><br />
                
            <span id="itemAddResult">{message}</span>
        </div>
    );
}

export default ItemUI;
