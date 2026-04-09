import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
    itemId: string;
    name: string;
    type: 'HAT' | 'SHIRT' | 'PANTS' | 'SHOES' | 'JACKET' | 'ACCESSORY';
    tags: string[];
    imageURL: string;
    notes: string;
}

interface Outfit {
    outfitId: string;
    name: string;
    description: string;
    items: Item[];
}

interface SlotPickerState {
    type: Item['type'];
    currentItem?: Item; // present when slot is already filled (swap mode)
}

type CatalogTab = 'outfits' | 'items';

// ─── Constants ────────────────────────────────────────────────────────────────

const SLOT_ORDER: Item['type'][] = ['HAT', 'SHIRT', 'PANTS', 'SHOES'];

const SLOT_EMOJI: Record<Item['type'], string> = {
    HAT:       '🧢',
    SHIRT:     '👕',
    PANTS:     '👖',
    SHOES:     '👟',
    JACKET:    '🧥',
    ACCESSORY: '💍',
};

const ALL_TYPES: Item['type'][] = ['HAT', 'SHIRT', 'PANTS', 'SHOES', 'JACKET', 'ACCESSORY'];

function makeNewItem(type: Item['type'] = 'SHIRT'): Item {
    return {
        itemId: Date.now().toString(), // TODO: replace with API generated ID
        name: '',
        type,
        tags: [],
        imageURL: '',
        notes: ''
    };
}

// ─── Main Component ───────────────────────────────────────────────────────────

function OutfitManagerPage() {
    const navigate = useNavigate();

    // ── State ──────────────────────────────────────────────────────────────────
    const [catalogTab, setCatalogTab]         = useState<CatalogTab>('outfits');
    const [outfits, setOutfits]               = useState<Outfit[]>([]);
    const [allItems, setAllItems]             = useState<Item[]>([]);
    const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
    const [editingItem, setEditingItem]       = useState<Item | null>(null);
    const [isNewItem, setIsNewItem]           = useState(false);
    const [slotPicker, setSlotPicker]         = useState<SlotPickerState | null>(null);
    const [outfitSearch, setOutfitSearch]     = useState('');
    const [itemSearch, setItemSearch]         = useState('');

    // ── Outfit Helpers ─────────────────────────────────────────────────────────

    function syncOutfit(updated: Outfit) {
        setSelectedOutfit(updated);
        setOutfits(prev => prev.map(o => o.outfitId === updated.outfitId ? updated : o));
    }

    function getSlotItem(type: Item['type']): Item | undefined {
        return selectedOutfit?.items.find(i => i.type === type);
    }

    function filteredOutfits(): Outfit[] {
        const q = outfitSearch.toLowerCase().trim();
        if (!q) return outfits;
        return outfits.filter(o =>
            o.name.toLowerCase().includes(q) ||
            o.items.some(i =>
                i.name.toLowerCase().includes(q) ||
                i.type.toLowerCase().includes(q) ||
                i.tags.some(t => t.toLowerCase().includes(q))
            )
        );
    }

    function filteredItems(): Item[] {
        const q = itemSearch.toLowerCase().trim();
        if (!q) return allItems;
        return allItems.filter(i =>
            i.name.toLowerCase().includes(q) ||
            i.type.toLowerCase().includes(q) ||
            i.tags.some(t => t.toLowerCase().includes(q))
        );
        // TODO: connect to POST /api/searchitems
    }

    // ── Outfit Actions ─────────────────────────────────────────────────────────

    function handleNewOutfit() {
        const newOutfit: Outfit = {
            outfitId: Date.now().toString(), // TODO: replace with API generated ID
            name: 'New Outfit',
            description: '',
            items: []
        };
        setOutfits(prev => [...prev, newOutfit]);
        setSelectedOutfit(newOutfit);
        setCatalogTab('outfits');
        // TODO: POST /api/addoutfit
    }

    function handleDeleteOutfit() {
        if (!selectedOutfit) return;
        setOutfits(prev => prev.filter(o => o.outfitId !== selectedOutfit.outfitId));
        setSelectedOutfit(null);
        // TODO: DELETE /api/deleteoutfit
    }

    function handleRenameOutfit(name: string) {
        if (!selectedOutfit) return;
        syncOutfit({ ...selectedOutfit, name });
        // TODO: PUT /api/updateoutfit
    }

    // ── Item Modal Helpers ─────────────────────────────────────────────────────

    function openNewItem(type: Item['type'] = 'SHIRT') {
        setEditingItem(makeNewItem(type));
        setIsNewItem(true);
        setSlotPicker(null);
    }

    function openEditItem(item: Item) {
        setEditingItem({ ...item });
        setIsNewItem(false);
        setSlotPicker(null);
    }

    // ── Slot Interactions ──────────────────────────────────────────────────────

    function handleClickSlot(type: Item['type']) {
        const existing = getSlotItem(type);
        // Always open the slot picker:
        // - empty slot: shows catalog + create new
        // - filled slot: shows current item with edit/swap options + catalog
        setSlotPicker({ type, currentItem: existing });
    }

    function handleAssignExistingToSlot(item: Item, type: Item['type']) {
        if (!selectedOutfit) return;
        const assigned = { ...item, type };
        const updatedItems = [
            ...selectedOutfit.items.filter(i => i.type !== type),
            assigned
        ];
        syncOutfit({ ...selectedOutfit, items: updatedItems });
        setSlotPicker(null);
        // TODO: PUT /api/updateoutfit
    }

    // ── Item Save / Delete ─────────────────────────────────────────────────────

    function handleSaveItem(item: Item) {
        // Update or add in allItems
        setAllItems(prev => {
            const exists = prev.find(i => i.itemId === item.itemId);
            return exists
                ? prev.map(i => i.itemId === item.itemId ? item : i)
                : [...prev, item];
        });

        // Sync into selected outfit if applicable
        if (selectedOutfit) {
            const existsInOutfit = selectedOutfit.items.find(i => i.itemId === item.itemId);
            const updatedItems = existsInOutfit
                ? selectedOutfit.items.map(i => i.itemId === item.itemId ? item : i)
                : [...selectedOutfit.items.filter(i => i.type !== item.type), item];
            syncOutfit({ ...selectedOutfit, items: updatedItems });
        }

        setEditingItem(null);
        // TODO: PUT /api/updateitem (+ Cloudinary upload if imageURL changed)
    }

    function handleDeleteItem(itemId: string) {
        setAllItems(prev => prev.filter(i => i.itemId !== itemId));
        if (selectedOutfit) {
            syncOutfit({
                ...selectedOutfit,
                items: selectedOutfit.items.filter(i => i.itemId !== itemId)
            });
        }
        setEditingItem(null);
        // TODO: DELETE /api/deleteitem + Cloudinary cleanup
    }

    function handleLogout() {
        localStorage.removeItem('user_data');
        localStorage.removeItem('token_data');
        navigate('/');
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            <div className="graffiti-wrapper" />

            <div className="om-page">

                {/* ── NAVBAR ── */}
                <nav className="om-navbar">
                    <span className="om-logo">OUTFITTR</span>
                    <div className="om-nav-center">
                        <button className="om-btn-cyan" onClick={() => openNewItem()}>+ NEW ITEM</button>
                        <button className="om-btn-yellow" onClick={handleNewOutfit}>+ NEW OUTFIT</button>
                    </div>
                    <button className="om-btn-ghost" onClick={handleLogout}>LOG OUT</button>
                </nav>

                {/* ── MAIN CONTENT ── */}
                <div className="om-content">

                    {/* ── LEFT — Armor Stand ── */}
                    <div className="om-left">
                        <div className="om-stand-label">
                            {selectedOutfit ? (
                                <input
                                    className="om-outfit-name-input"
                                    value={selectedOutfit.name}
                                    onChange={e => handleRenameOutfit(e.target.value)}
                                />
                            ) : (
                                <span className="om-no-selection">← SELECT AN OUTFIT</span>
                            )}
                        </div>

                        <div className="om-stand">
                            {/* TODO: replace with actual mannequin/character asset */}
                            <div className="om-stand-figure">🪆</div>

                            <div className="om-slots">
                                {SLOT_ORDER.map(type => {
                                    const item = getSlotItem(type);
                                    return (
                                        <div
                                            key={type}
                                            className={`om-slot ${item ? 'filled' : 'empty'} ${!selectedOutfit ? 'disabled' : ''}`}
                                            onClick={() => selectedOutfit && handleClickSlot(type)}
                                        >
                                            <span className="om-slot-icon">{SLOT_EMOJI[type]}</span>
                                            <div className="om-slot-info">
                                                <span className="om-slot-type">{type}</span>
                                                <span className="om-slot-name">
                                                    {item ? item.name || 'Unnamed' : 'Empty — click to add'}
                                                </span>
                                            </div>
                                            {item?.imageURL && (
                                                <img className="om-slot-thumb" src={item.imageURL} alt={item.name} />
                                            )}
                                        </div>
                                    );
                                })}
                            </div>

                            {selectedOutfit && (
                                <button className="om-btn-danger om-delete-outfit-btn" onClick={handleDeleteOutfit}>
                                    DELETE OUTFIT
                                </button>
                            )}
                        </div>
                    </div>

                    {/* ── RIGHT — Tabbed Catalog ── */}
                    <div className="om-right">
                        <div className="om-tabs">
                            <button
                                className={`om-tab ${catalogTab === 'outfits' ? 'active' : ''}`}
                                onClick={() => setCatalogTab('outfits')}
                            >
                                OUTFITS <span className="om-tab-count">{outfits.length}</span>
                            </button>
                            <button
                                className={`om-tab ${catalogTab === 'items' ? 'active' : ''}`}
                                onClick={() => setCatalogTab('items')}
                            >
                                ITEMS <span className="om-tab-count">{allItems.length}</span>
                            </button>
                        </div>

                        {/* OUTFITS TAB */}
                        {catalogTab === 'outfits' && (
                            <div className="om-tab-content">
                                <input
                                    className="om-tab-search"
                                    placeholder="SEARCH OUTFITS..."
                                    value={outfitSearch}
                                    onChange={e => setOutfitSearch(e.target.value)}
                                />
                                {filteredOutfits().length === 0 ? (
                                    <div className="om-empty">
                                        {outfits.length === 0
                                            ? 'No outfits yet — hit + NEW OUTFIT to get started.'
                                            : 'No outfits match your search.'}
                                    </div>
                                ) : (
                                    <div className="om-cards-list">
                                        {filteredOutfits().map(outfit => (
                                            <div
                                                key={outfit.outfitId}
                                                className={`om-outfit-card ${selectedOutfit?.outfitId === outfit.outfitId ? 'active' : ''}`}
                                                onClick={() => { setSelectedOutfit(outfit); setEditingItem(null); }}
                                            >
                                                <div className="om-card-name">{outfit.name}</div>
                                                <div className="om-card-tags">
                                                    {outfit.items.length === 0
                                                        ? <span className="om-card-empty">No items yet</span>
                                                        : outfit.items.map(item => (
                                                            <span key={item.itemId} className="om-item-pip" title={item.name}>
                                                                {SLOT_EMOJI[item.type]}
                                                            </span>
                                                        ))
                                                    }
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        {/* ITEMS TAB */}
                        {catalogTab === 'items' && (
                            <div className="om-tab-content">
                                <input
                                    className="om-tab-search"
                                    placeholder="SEARCH BY NAME, TYPE, TAG..."
                                    value={itemSearch}
                                    onChange={e => setItemSearch(e.target.value)}
                                    // TODO: connect to POST /api/searchitems
                                />
                                {filteredItems().length === 0 ? (
                                    <div className="om-empty">
                                        {allItems.length === 0
                                            ? 'No items yet — hit + NEW ITEM to add one.'
                                            : 'No items match your search.'}
                                    </div>
                                ) : (
                                    <div className="om-items-grid">
                                        {filteredItems().map(item => (
                                            <div
                                                key={item.itemId}
                                                className="om-item-card"
                                                onClick={() => openEditItem(item)}
                                            >
                                                <div className="om-item-card-image">
                                                    {item.imageURL
                                                        ? <img src={item.imageURL} alt={item.name} />
                                                        : <div className="om-item-card-no-image">{SLOT_EMOJI[item.type]}</div>
                                                    }
                                                    {/* TODO: replace with Cloudinary URL */}
                                                </div>
                                                <div className="om-item-card-info">
                                                    <span className="om-item-card-name">{item.name || 'Unnamed'}</span>
                                                    <span className="om-item-card-type">{item.type}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── SLOT PICKER — empty slot OR swap for filled slot ── */}
            {slotPicker && selectedOutfit && (
                <SlotPicker
                    slotType={slotPicker.type}
                    currentItem={slotPicker.currentItem}
                    allItems={allItems}
                    onPickExisting={(item) => handleAssignExistingToSlot(item, slotPicker.type)}
                    onEditCurrent={() => slotPicker.currentItem && openEditItem(slotPicker.currentItem)}
                    onCreateNew={() => openNewItem(slotPicker.type)}
                    onClose={() => setSlotPicker(null)}
                />
            )}

            {/* ── ITEM EDIT MODAL ── */}
            {editingItem && (
                <ItemEditModal
                    item={editingItem}
                    isNew={isNewItem}
                    onSave={handleSaveItem}
                    onDelete={handleDeleteItem}
                    onClose={() => setEditingItem(null)}
                />
            )}
        </>
    );
}

// ─── Slot Picker ──────────────────────────────────────────────────────────────

interface SlotPickerProps {
    slotType: Item['type'];
    currentItem?: Item;
    allItems: Item[];
    onPickExisting: (item: Item) => void;
    onEditCurrent: () => void;
    onCreateNew: () => void;
    onClose: () => void;
}

function SlotPicker({ slotType, currentItem, allItems, onPickExisting, onEditCurrent, onCreateNew, onClose }: SlotPickerProps) {
    const [search, setSearch] = useState('');

    // Exclude the current item from the swap list so you can't swap with itself
    const swapCandidates = allItems.filter(i => {
        if (i.itemId === currentItem?.itemId) return false;
        const q = search.toLowerCase().trim();
        if (!q) return true;
        return (
            i.name.toLowerCase().includes(q) ||
            i.type.toLowerCase().includes(q) ||
            i.tags.some(t => t.toLowerCase().includes(q))
        );
    });

    const isSwapMode = !!currentItem;

    return (
        <div className="om-modal-overlay">
            <div className="om-modal">

                <div className="om-modal-header">
                    <h2 className="graffiti-title" style={{ fontSize: '1.2rem', margin: 0 }}>
                        {SLOT_EMOJI[slotType]} {isSwapMode ? `SWAP ${slotType}` : `${slotType} SLOT`}
                    </h2>
                    <button className="om-btn-ghost" onClick={onClose}>✕</button>
                </div>

                {/* ── CURRENT ITEM (swap mode only) ── */}
                {isSwapMode && currentItem && (
                    <div className="om-picker-current">
                        <div className="om-picker-current-label">CURRENTLY EQUIPPED</div>
                        <div className="om-picker-current-item">
                            <div className="om-picker-current-info">
                                {currentItem.imageURL
                                    ? <img className="om-picker-current-thumb" src={currentItem.imageURL} alt={currentItem.name} />
                                    : <span className="om-picker-item-emoji">{SLOT_EMOJI[currentItem.type]}</span>
                                }
                                <div className="om-picker-item-info">
                                    <span className="om-picker-item-name">{currentItem.name || 'Unnamed'}</span>
                                    <span className="om-picker-item-type">{currentItem.type}</span>
                                </div>
                            </div>
                            <button className="om-btn-cyan" style={{ padding: '6px 12px', fontSize: '0.75rem' }} onClick={onEditCurrent}>
                                EDIT
                            </button>
                        </div>
                        <div className="om-picker-divider">
                            <span>SWAP WITH</span>
                        </div>
                    </div>
                )}

                {!isSwapMode && (
                    <p className="om-picker-hint">Pick from your existing items or create a new one.</p>
                )}

                <input
                    className="om-input"
                    placeholder="SEARCH YOUR ITEMS..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    autoFocus
                />

                {/* Catalog list */}
                <div className="om-picker-list">
                    {swapCandidates.length === 0 ? (
                        <p className="om-picker-empty">
                            {allItems.length === 0
                                ? 'No items in your catalog yet.'
                                : 'No other items match your search.'}
                        </p>
                    ) : (
                        swapCandidates.map(item => (
                            <div
                                key={item.itemId}
                                className="om-picker-item"
                                onClick={() => onPickExisting(item)}
                            >
                                {item.imageURL
                                    ? <img className="om-slot-thumb" src={item.imageURL} alt={item.name} />
                                    : <span className="om-picker-item-emoji">{SLOT_EMOJI[item.type]}</span>
                                }
                                <div className="om-picker-item-info">
                                    <span className="om-picker-item-name">{item.name || 'Unnamed'}</span>
                                    <span className="om-picker-item-type">{item.type}</span>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <button
                    className="om-btn-yellow"
                    style={{ width: '100%', marginTop: '0.75rem' }}
                    onClick={onCreateNew}
                >
                    + CREATE NEW {slotType}
                </button>

            </div>
        </div>
    );
}

// ─── Item Edit Modal ──────────────────────────────────────────────────────────

interface ItemEditModalProps {
    item: Item;
    isNew: boolean;
    onSave: (item: Item) => void;
    onDelete: (id: string) => void;
    onClose: () => void;
}

function ItemEditModal({ item, isNew, onSave, onDelete, onClose }: ItemEditModalProps) {
    const [name, setName]         = useState(item.name);
    const [type, setType]         = useState(item.type);
    const [notes, setNotes]       = useState(item.notes);
    const [tags, setTags]         = useState(item.tags.join(', '));
    const [imageURL, setImageURL] = useState(item.imageURL);

    function handleSave() {
        onSave({
            ...item,
            name,
            type,
            notes,
            imageURL,
            tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        });
    }

    return (
        <div className="om-modal-overlay">
            <div className="om-modal">

                <div className="om-modal-header">
                    <h2 className="graffiti-title" style={{ fontSize: '1.3rem', margin: 0 }}>
                        {isNew ? 'NEW ITEM' : 'EDIT ITEM'}
                    </h2>
                    <button className="om-btn-ghost" onClick={onClose}>✕</button>
                </div>

                {/* Image preview — TODO: replace with Cloudinary widget */}
                <div className="om-item-image">
                    {imageURL
                        ? <img src={imageURL} alt={name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        : <div className="om-image-placeholder">
                            {SLOT_EMOJI[type]}
                            <p>No image yet</p>
                          </div>
                    }
                </div>

                <input className="om-input" value={name} onChange={e => setName(e.target.value)} placeholder="ITEM NAME" />

                <select className="om-input" value={type} onChange={e => setType(e.target.value as Item['type'])}>
                    {ALL_TYPES.map(t => (
                        <option key={t} value={t}>{SLOT_EMOJI[t]} {t}</option>
                    ))}
                </select>

                <input className="om-input" value={imageURL} onChange={e => setImageURL(e.target.value)} placeholder="IMAGE URL — Cloudinary coming soon" />
                <input className="om-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="TAGS — comma separated" />
                <textarea className="om-input om-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />

                <div className="om-modal-actions">
                    <button className="om-btn-yellow" onClick={handleSave}>SAVE</button>
                    {!isNew && (
                        <button className="om-btn-danger" onClick={() => onDelete(item.itemId)}>DELETE</button>
                    )}
                </div>

            </div>
        </div>
    );
}

export default OutfitManagerPage;