import { useState } from 'react';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Item {
    itemId: string;
    name: string;
    type: string;
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

// ─── View Types ───────────────────────────────────────────────────────────────

type View = 'manager' | 'outfit' | 'item';

// ─── Main Component ───────────────────────────────────────────────────────────

function OutfitManagerPage() {

    // ── State ──────────────────────────────────────────────────────────────────
    const [view, setView] = useState<View>('manager');
    const [outfits, setOutfits] = useState<Outfit[]>([]);
    const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
    const [selectedItem, setSelectedItem] = useState<Item | null>(null);

    // ── Outfit Actions ─────────────────────────────────────────────────────────

    function handleNewOutfit() {
        const newOutfit: Outfit = {
            outfitId: Date.now().toString(), // TODO: replace with DB generated ID
            name: 'New Outfit',
            description: '',
            items: []
        };
        setOutfits([...outfits, newOutfit]);
        setSelectedOutfit(newOutfit);
        setView('outfit');
    }

    function handleSelectOutfit(outfit: Outfit) {
        setSelectedOutfit(outfit);
        setView('outfit');
    }

    function handleSaveOutfit(updated: Outfit) {
        setOutfits(outfits.map(o => o.outfitId === updated.outfitId ? updated : o));
        setSelectedOutfit(updated);
        // TODO: connect to API → PUT /api/updateoutfit
    }

    function handleDeleteOutfit(outfitId: string) {
        setOutfits(outfits.filter(o => o.outfitId !== outfitId));
        setView('manager');
        // TODO: connect to API → DELETE /api/deleteoutfit
    }

    // ── Item Actions ───────────────────────────────────────────────────────────

    function handleNewItem() {
        if (!selectedOutfit) return;
        const newItem: Item = {
            itemId: Date.now().toString(), // TODO: replace with DB generated ID
            name: 'New Item',
            type: 'SHIRT',
            tags: [],
            imageURL: '',
            notes: ''
        };
        const updatedOutfit = { ...selectedOutfit, items: [...selectedOutfit.items, newItem] };
        handleSaveOutfit(updatedOutfit);
        setSelectedItem(newItem);
        setView('item');
        // TODO: connect to API → POST /api/additem
    }

    function handleSelectItem(item: Item) {
        setSelectedItem(item);
        setView('item');
    }

    function handleSaveItem(updated: Item) {
        if (!selectedOutfit) return;
        const updatedItems = selectedOutfit.items.map(i => i.itemId === updated.itemId ? updated : i);
        const updatedOutfit = { ...selectedOutfit, items: updatedItems };
        handleSaveOutfit(updatedOutfit);
        setSelectedItem(updated);
        // TODO: connect to API → PUT /api/updateitem
    }

    function handleDeleteItem(itemId: string) {
        if (!selectedOutfit) return;
        const updatedItems = selectedOutfit.items.filter(i => i.itemId !== itemId);
        const updatedOutfit = { ...selectedOutfit, items: updatedItems };
        handleSaveOutfit(updatedOutfit);
        setView('outfit');
        // TODO: connect to API → DELETE /api/deleteitem
    }

    // ── Render ─────────────────────────────────────────────────────────────────

    return (
        <>
            {/* Background */}
            <div className="graffiti-wrapper" />

            {/* Page Content */}
            <div className="manager-container">

                {/* ── MANAGER VIEW ── */}
                {view === 'manager' && (
                    <div className="manager-view">
                        <div className="manager-header">
                            <h1 className="graffiti-title">MY OUTFITS</h1>
                            <button className="outfit-btn-yellow" onClick={handleNewOutfit}>
                                + NEW OUTFIT
                            </button>
                        </div>

                        {outfits.length === 0 ? (
                            <div className="empty-state">
                                <p>No outfits yet. Hit <strong>+ NEW OUTFIT</strong> to get started.</p>
                            </div>
                        ) : (
                            <div className="outfit-grid">
                                {outfits.map(outfit => (
                                    <div
                                        key={outfit.outfitId}
                                        className="outfit-card"
                                        onClick={() => handleSelectOutfit(outfit)}
                                    >
                                        <div className="outfit-card-title">{outfit.name}</div>
                                        <div className="outfit-card-items">
                                            {outfit.items.length === 0 ? (
                                                <span className="empty-items">No items yet</span>
                                            ) : (
                                                outfit.items.map(item => (
                                                    <span key={item.itemId} className="item-tag">
                                                        {item.type}
                                                    </span>
                                                ))
                                            )}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* ── OUTFIT VIEW ── */}
                {view === 'outfit' && selectedOutfit && (
                    <OutfitView
                        outfit={selectedOutfit}
                        onBack={() => setView('manager')}
                        onSave={handleSaveOutfit}
                        onDelete={handleDeleteOutfit}
                        onNewItem={handleNewItem}
                        onSelectItem={handleSelectItem}
                    />
                )}

                {/* ── ITEM VIEW ── */}
                {view === 'item' && selectedItem && (
                    <ItemView
                        item={selectedItem}
                        onBack={() => setView('outfit')}
                        onSave={handleSaveItem}
                        onDelete={handleDeleteItem}
                    />
                )}

            </div>
        </>
    );
}

// ─── Outfit View Component ────────────────────────────────────────────────────

interface OutfitViewProps {
    outfit: Outfit;
    onBack: () => void;
    onSave: (outfit: Outfit) => void;
    onDelete: (id: string) => void;
    onNewItem: () => void;
    onSelectItem: (item: Item) => void;
}

function OutfitView({ outfit, onBack, onSave, onDelete, onNewItem, onSelectItem }: OutfitViewProps) {
    const [name, setName] = useState(outfit.name);
    const [description, setDescription] = useState(outfit.description);

    function handleSave() {
        onSave({ ...outfit, name, description });
    }

    return (
        <div className="detail-view">
            <div className="login-card" style={{ width: '500px', maxWidth: '90vw' }}>

                {/* Header */}
                <div className="detail-header">
                    <button className="outfit-btn-ghost" onClick={onBack}>← BACK</button>
                    <input
                        className="outfit-name-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="OUTFIT NAME"
                    />
                </div>

                {/* Description */}
                <textarea
                    className="outfit-notes"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                    placeholder="Optional notes..."
                />

                {/* Items */}
                <div className="items-section">
                    <div className="items-label">ITEMS</div>
                    {outfit.items.length === 0 ? (
                        <p className="empty-items">No items yet. Add one below.</p>
                    ) : (
                        <div className="items-grid">
                            {outfit.items.map(item => (
                                <div
                                    key={item.itemId}
                                    className="item-card"
                                    onClick={() => onSelectItem(item)}
                                >
                                    <div className="item-image-placeholder">
                                        {/* TODO: render item.imageURL when available */}
                                        📷
                                    </div>
                                    <div className="item-card-name">{item.name}</div>
                                    <div className="item-card-type">{item.type}</div>
                                </div>
                            ))}
                        </div>
                    )}
                    <button className="outfit-btn-yellow" onClick={onNewItem}>+ NEW ITEM</button>
                </div>

                {/* Actions */}
                <div className="detail-actions">
                    <button className="outfit-btn-yellow" onClick={handleSave}>SAVE</button>
                    <button className="outfit-btn-danger" onClick={() => onDelete(outfit.outfitId)}>DELETE</button>
                </div>

            </div>
        </div>
    );
}

// ─── Item View Component ──────────────────────────────────────────────────────

interface ItemViewProps {
    item: Item;
    onBack: () => void;
    onSave: (item: Item) => void;
    onDelete: (id: string) => void;
}

function ItemView({ item, onBack, onSave, onDelete }: ItemViewProps) {
    const [name, setName] = useState(item.name);
    const [type, setType] = useState(item.type);
    const [notes, setNotes] = useState(item.notes);
    const [tags, setTags] = useState(item.tags.join(', '));
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
        <div className="detail-view">
            <div className="login-card" style={{ width: '420px', maxWidth: '90vw' }}>

                {/* Header */}
                <div className="detail-header">
                    <button className="outfit-btn-ghost" onClick={onBack}>← BACK</button>
                    <input
                        className="outfit-name-input"
                        value={name}
                        onChange={e => setName(e.target.value)}
                        placeholder="ITEM NAME"
                    />
                </div>

                {/* Image */}
                <div className="item-image-large">
                    {imageURL ? (
                        <img src={imageURL} alt={name} />
                    ) : (
                        <div className="image-placeholder-large">
                            📷
                            <p>No image yet</p>
                            {/* TODO: add image upload functionality */}
                        </div>
                    )}
                </div>

                {/* Image URL input */}
                <input
                    className="outfit-input"
                    value={imageURL}
                    onChange={e => setImageURL(e.target.value)}
                    placeholder="IMAGE URL (optional)"
                />

                {/* Type */}
                <select
                    className="outfit-select"
                    value={type}
                    onChange={e => setType(e.target.value)}
                >
                    <option value="SHIRT">SHIRT</option>
                    <option value="PANTS">PANTS</option>
                    <option value="SHOES">SHOES</option>
                    <option value="JACKET">JACKET</option>
                    <option value="HAT">HAT</option>
                    <option value="ACCESSORY">ACCESSORY</option>
                    <option value="OTHER">OTHER</option>
                </select>

                {/* Tags */}
                <input
                    className="outfit-input"
                    value={tags}
                    onChange={e => setTags(e.target.value)}
                    placeholder="TAGS (comma separated)"
                />

                {/* Notes */}
                <textarea
                    className="outfit-notes"
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    placeholder="Optional notes..."
                />

                {/* Actions */}
                <div className="detail-actions">
                    <button className="outfit-btn-yellow" onClick={handleSave}>SAVE</button>
                    <button className="outfit-btn-danger" onClick={() => onDelete(item.itemId)}>DELETE</button>
                </div>

            </div>
        </div>
    );
}

export default OutfitManagerPage;