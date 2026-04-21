import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { clearSession, getAccessToken, storeAccessToken } from "../utils/session";
import { buildPath } from '../components/Path';


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
        itemId: Date.now().toString(), 
        name: '',
        type,
        tags: [],
        imageURL: '',
        notes: ''
    };
}

function normalizeItem(rawItem: any): Item {
    let tags: string[] = [];

    if (Array.isArray(rawItem.tags)) {
        tags = rawItem.tags;
    } else if (typeof rawItem.tags === "string") {
        try {
            const parsedTags = JSON.parse(rawItem.tags);
            tags = Array.isArray(parsedTags)
                ? parsedTags
                : rawItem.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
        } catch {
            tags = rawItem.tags.split(",").map((tag: string) => tag.trim()).filter(Boolean);
        }
    }

    return {
        itemId: rawItem.itemId || rawItem._id || Date.now().toString(),
        name: rawItem.name || "",
        type: rawItem.type || "SHIRT",
        tags,
        imageURL: rawItem.imageURL || "",
        notes: rawItem.notes || "",
    };
}

function normalizeOutfit(rawOutfit: any): Outfit {
    const items = Array.isArray(rawOutfit.items)
        ? rawOutfit.items.map(normalizeItem)
        : [];

    return {
        outfitId: rawOutfit.outfitId || rawOutfit._id || Date.now().toString(),
        name: rawOutfit.name || '',
        description: rawOutfit.description || '',
        items
    };
}

function loadImage(file: File): Promise<HTMLImageElement> {
    return new Promise((resolve, reject) => {
        const url = URL.createObjectURL(file);
        const image = new Image();

        image.onload = () => {
            URL.revokeObjectURL(url);
            resolve(image);
        };
        image.onerror = () => {
            URL.revokeObjectURL(url);
            reject(new Error("Could not load image."));
        };
        image.src = url;
    });
}

function colorDistance(
    r1: number,
    g1: number,
    b1: number,
    r2: number,
    g2: number,
    b2: number
) {
    return Math.sqrt((r1 - r2) ** 2 + (g1 - g2) ** 2 + (b1 - b2) ** 2);
}

function getPixelIndex(x: number, y: number, width: number) {
    return (y * width + x) * 4;
}

async function autoTrimClothingImage(file: File): Promise<File> {
    const image = await loadImage(file);
    const maxSide = 1400;
    const scale = Math.min(1, maxSide / Math.max(image.width, image.height));
    const width = Math.max(1, Math.round(image.width * scale));
    const height = Math.max(1, Math.round(image.height * scale));
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d", { willReadFrequently: true });

    if (!context) {
        return file;
    }

    canvas.width = width;
    canvas.height = height;
    context.drawImage(image, 0, 0, width, height);

    const imageData = context.getImageData(0, 0, width, height);
    const { data } = imageData;
    const edgeSamples: Array<[number, number]> = [];
    const sampleStep = Math.max(8, Math.floor(Math.min(width, height) / 28));

    for (let x = 0; x < width; x += sampleStep) {
        edgeSamples.push([x, 0], [x, height - 1]);
    }

    for (let y = 0; y < height; y += sampleStep) {
        edgeSamples.push([0, y], [width - 1, y]);
    }

    const background = edgeSamples.reduce(
        (sum, [x, y]) => {
            const index = getPixelIndex(x, y, width);
            return {
                r: sum.r + data[index],
                g: sum.g + data[index + 1],
                b: sum.b + data[index + 2],
            };
        },
        { r: 0, g: 0, b: 0 }
    );

    const bgR = background.r / edgeSamples.length;
    const bgG = background.g / edgeSamples.length;
    const bgB = background.b / edgeSamples.length;
    const backgroundBrightness = Math.max(bgR, bgG, bgB) / 255;
    const backgroundSaturation = (Math.max(bgR, bgG, bgB) - Math.min(bgR, bgG, bgB)) / 255;
    const backgroundThreshold = backgroundBrightness > 0.72 && backgroundSaturation < 0.18 ? 58 : 44;
    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;

    for (let y = 0; y < height; y += 1) {
        for (let x = 0; x < width; x += 1) {
            const index = (y * width + x) * 4;
            const red = data[index];
            const green = data[index + 1];
            const blue = data[index + 2];
            const alpha = data[index + 3];
            const brightness = Math.max(red, green, blue) / 255;
            const saturation = (Math.max(red, green, blue) - Math.min(red, green, blue)) / 255;
            const distanceFromBackground = colorDistance(red, green, blue, bgR, bgG, bgB);
            const differsFromBackground = distanceFromBackground > backgroundThreshold;
            const visibleTransparentPixel = alpha > 24 && alpha < 245;
            const likelyPlainBackground =
                alpha > 24 &&
                distanceFromBackground < backgroundThreshold &&
                (
                    backgroundBrightness > 0.72 ||
                    (brightness > 0.76 && saturation < 0.16)
                );
            const likelyForeground =
                alpha > 24 &&
                !likelyPlainBackground &&
                (visibleTransparentPixel || differsFromBackground || saturation > 0.18 || brightness < 0.82);

            if (likelyPlainBackground) {
                data[index + 3] = distanceFromBackground > backgroundThreshold - 8 ? 70 : 0;
            }

            if (likelyForeground) {
                minX = Math.min(minX, x);
                minY = Math.min(minY, y);
                maxX = Math.max(maxX, x);
                maxY = Math.max(maxY, y);
            }
        }
    }

    if (maxX < minX || maxY < minY) {
        return file;
    }

    context.putImageData(imageData, 0, 0);

    const trimWidth = maxX - minX + 1;
    const trimHeight = maxY - minY + 1;
    const padding = Math.round(Math.max(trimWidth, trimHeight) * 0.05);
    const cropX = Math.max(0, minX - padding);
    const cropY = Math.max(0, minY - padding);
    const cropWidth = Math.min(width - cropX, trimWidth + padding * 2);
    const cropHeight = Math.min(height - cropY, trimHeight + padding * 2);
    const output = document.createElement("canvas");
    const outputContext = output.getContext("2d");

    if (!outputContext) {
        return file;
    }

    output.width = cropWidth;
    output.height = cropHeight;
    outputContext.drawImage(canvas, cropX, cropY, cropWidth, cropHeight, 0, 0, cropWidth, cropHeight);

    const blob = await new Promise<Blob | null>((resolve) => output.toBlob(resolve, "image/png"));

    if (!blob) {
        return file;
    }

    const trimmedName = file.name.replace(/\.[^.]+$/, "") + "-trimmed.png";
    return new File([blob], trimmedName, { type: "image/png" });
}

function OutfitPreview({ getSlotItem }: { getSlotItem: (type: Item['type']) => Item | undefined }) {
    const previewSlots: Item['type'][] = ['HAT', 'SHIRT', 'PANTS', 'SHOES'];

    return (
        <div className="outfit-preview-stage" aria-label="Rotating outfit preview">
            <div className="outfit-preview-shadow" />
            <div className="outfit-preview-model">
                <div className="model-head professor-head">
                    <img src="/professor.png" alt="Professor model head" />
                </div>
                <div className="model-neck" />
                <div className="model-arm model-arm-left" />
                <div className="model-arm model-arm-right" />
                <div className="model-leg model-leg-left" />
                <div className="model-leg model-leg-right" />
                <div className="model-body">
                    {previewSlots.map(type => {
                        const item = getSlotItem(type);
                        const label = item?.name?.trim() || type;

                        return (
                            <div
                                key={type}
                                className={`model-piece model-piece-${type.toLowerCase()} ${item ? 'filled' : 'empty'} ${item?.imageURL ? 'has-image' : ''}`}
                            >
                                {item?.imageURL && type === 'SHOES' ? (
                                    <>
                                        <img className="shoe-image shoe-image-left" src={item.imageURL} alt={`${label} left shoe`} />
                                        <img className="shoe-image shoe-image-right" src={item.imageURL} alt={`${label} right shoe`} />
                                    </>
                                ) : item?.imageURL ? (
                                    <img src={item.imageURL} alt={label} />
                                ) : (
                                    <span>{item ? label : type}</span>
                                )}
                            </div>
                        );
                    })}
                </div>
                <div className="model-stand-base" />
            </div>
        </div>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

function OutfitManagerPage() {
    const navigate = useNavigate();

    const userDataString = localStorage.getItem('user_data');
    const userId = userDataString ? JSON.parse(userDataString).id : '';

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

    // ── API Actions ────────────────────────────────────────────────────────────

    const fetchUserItems = async () => {
        const token = getAccessToken();
        if (!token || !userId) return;

        try {
            const response = await fetch(buildPath('api/searchitems'), {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}`
                },
                body: JSON.stringify({
                    search: ""
                })
            });

            const res = await response.json();
            if (response.status === 401) {
                clearSession();
                navigate('/');
                return;
            }

            if (response.status === 403) {
                console.error("Wardrobe access blocked:", res.error);
                return;
            }

            // Note: If your backend returns "results", use res.results. 
            // If it returns "items", use res.items.
            if (res.results) {
                setAllItems(res.results.map(normalizeItem));
            } else if (res.items) {
                setAllItems(res.items.map(normalizeItem));
            }

            if (res.accessToken) {
                storeAccessToken(res.accessToken);
            }
        } catch (e) {
            console.error("Error fetching wardrobe:", e);
        }
    };

    const fetchUserOutfits = async () => {
        const token = getAccessToken();
        if (!token || !userId) return;

        try {
            const response = await fetch(buildPath('api/searchoutfits'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    search: "",
                    jwtToken: token
                })
            });

            const res = await response.json();
            if (res.error) {
                console.error("Error fetching outfits:", res.error);
                return;
            }

            const loadedOutfits = Array.isArray(res.results)
                ? res.results.map(normalizeOutfit)
                : [];

            setOutfits(loadedOutfits);
            setSelectedOutfit(currentSelected => {
                if (!currentSelected) {
                    return loadedOutfits[0] || null;
                }

                return loadedOutfits.find(outfit => outfit.outfitId === currentSelected.outfitId) || null;
            });
        } catch (e) {
            console.error("Error fetching outfits:", e);
        }
    };

    const saveOutfit = async (outfit: Outfit, isNew: boolean = false) => {
        const token = getAccessToken();
        if (!token || !userId) {
            alert("Session expired. Please log in again.");
            return null;
        }

        try {
            const endpoint = isNew ? 'api/addoutfit' : 'api/editoutfit';
            const body: Record<string, any> = {
                userId: userId,
                name: outfit.name,
                description: outfit.description,
                itemIds: outfit.items.map(item => item.itemId),
                jwtToken: token
            };

            if (!isNew) {
                body.outfitId = outfit.outfitId;
            }

            const response = await fetch(buildPath(endpoint), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(body)
            });

            const res = await response.json();
            if (res.error) {
                alert("Error: " + res.error);
                return null;
            }

            const savedOutfit = normalizeOutfit(res.outfit || {
                ...outfit,
                outfitId: res.id || outfit.outfitId
            });

            setOutfits(prev => {
                const exists = prev.some(existing => existing.outfitId === savedOutfit.outfitId);
                return exists
                    ? prev.map(existing => existing.outfitId === savedOutfit.outfitId ? savedOutfit : existing)
                    : [...prev, savedOutfit];
            });
            setSelectedOutfit(savedOutfit);

            return savedOutfit;
        } catch (e) {
            console.error("Error saving outfit:", e);
            alert("Network error: " + e);
            return null;
        }
    };

    useEffect(() => {
        if (userId) {
            fetchUserItems();
            fetchUserOutfits();
        }
    }, [userId]);

    // ── Outfit Helpers ─────────────────────────────────────────────────────────

    async function syncOutfit(updated: Outfit) {
        setSelectedOutfit(updated);
        setOutfits(prev => prev.map(o => o.outfitId === updated.outfitId ? updated : o));
        await saveOutfit(updated);
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
    }

    // ── Outfit Actions ─────────────────────────────────────────────────────────

    async function handleNewOutfit() {
        const newOutfit: Outfit = {
            outfitId: '',
            name: 'New Outfit',
            description: '',
            items: []
        };
        const savedOutfit = await saveOutfit(newOutfit, true);
        if (!savedOutfit) {
            return;
        }
        setCatalogTab('outfits');
    }

    async function handleDeleteOutfit() {
        if (!selectedOutfit) return;

        const token = getAccessToken();
        if (!token) {
            alert("Session expired. Please log in again.");
            return;
        }

        try {
            const response = await fetch(buildPath('api/deleteoutfit'), {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    userId: userId,
                    outfitId: selectedOutfit.outfitId,
                    jwtToken: token
                })
            });

            const res = await response.json();
            if (res.error) {
                alert("Error: " + res.error);
                return;
            }

            setOutfits(prev => prev.filter(o => o.outfitId !== selectedOutfit.outfitId));
            setSelectedOutfit(null);
        } catch (e) {
            console.error("Error deleting outfit:", e);
            alert("Network error: " + e);
        }
    }

    function handleRenameOutfit(name: string) {
        if (!selectedOutfit) return;
        void syncOutfit({ ...selectedOutfit, name });
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
        setSlotPicker({ type, currentItem: existing });
    }

    function handleAssignExistingToSlot(item: Item, type: Item['type']) {
        if (!selectedOutfit) return;
        const assigned = { ...item, type };
        const updatedItems = [
            ...selectedOutfit.items.filter(i => i.type !== type),
            assigned
        ];
        void syncOutfit({ ...selectedOutfit, items: updatedItems });
        setSlotPicker(null);
    }

    // ── Item Save / Delete ─────────────────────────────────────────────────────

    async function handleSaveItem(item: Item, file: File | null) {
        const token = getAccessToken();
        if (!token) {
            alert("Session expired. Please log in again.");
            return;
        }

        const formData = new FormData();
        
        if (item.itemId && !isNewItem) {
            formData.append('itemId', item.itemId);
        }

        formData.append('name', item.name);
        formData.append('type', item.type);
        formData.append('notes', item.notes);
        formData.append('tags', JSON.stringify(item.tags));

        if (file) {
            formData.append('image', file);
        }

        try {
            const endpoint = isNewItem ? 'api/additem' : 'api/edititem';
            const response = await fetch(buildPath(endpoint), {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`
                },
                body: formData 
            });

            const responseText = await response.text();
            let res;

            try {
                res = JSON.parse(responseText);
            } catch {
                throw new Error(responseText.slice(0, 160) || "Upload endpoint did not return JSON.");
            }

            if (response.status === 401) {
                clearSession();
                navigate('/');
                return;
            }

            if (res.error) {
                alert("Error: " + res.error);
                return;
            }

            if (res.accessToken) {
                storeAccessToken(res.accessToken);
            }

            const savedItem = normalizeItem({
                ...item,
                ...(res.item || {}),
                itemId: res.id || res.item?.itemId || item.itemId,
                imageURL: res.imageURL || res.item?.imageURL || item.imageURL,
            });

            setAllItems(prev => {
                const exists = prev.find(i => i.itemId === savedItem.itemId);
                return exists
                    ? prev.map(i => i.itemId === savedItem.itemId ? savedItem : i)
                    : [...prev, savedItem];
            });

            if (selectedOutfit) {
                const existsInOutfit = selectedOutfit.items.find(i => i.itemId === savedItem.itemId);
                const updatedItems = existsInOutfit
                    ? selectedOutfit.items.map(i => i.itemId === savedItem.itemId ? savedItem : i)
                    : [...selectedOutfit.items.filter(i => i.type !== savedItem.type), savedItem];
                await syncOutfit({ ...selectedOutfit, items: updatedItems });
            }

            setEditingItem(null);

        } catch (error: any) {
            console.error("Upload failed:", error);
            alert("Network error: " + error.toString());
        }
    }

    function handleDeleteItem(itemId: string) {
        setAllItems(prev => prev.filter(i => i.itemId !== itemId));
        if (selectedOutfit) {
            void syncOutfit({
                ...selectedOutfit,
                items: selectedOutfit.items.filter(i => i.itemId !== itemId)
            });
        }
        setEditingItem(null);
    }

    function handleLogout() {
        clearSession();
        navigate('/');
    }

    return (
        <>
            <div className="graffiti-wrapper outfit-backdrop" />
            <div className="om-page">
                <nav className="om-navbar">
                    <span className="om-logo nav-bubble-title" aria-label="OUTFITTR">
                        <span className="bubble-title-line">
                            <span className="bubble-char">O</span>
                            <span className="bubble-char">U</span>
                            <span className="bubble-char">T</span>
                            <span className="bubble-char">F</span>
                            <span className="bubble-char">I</span>
                            <span className="bubble-char">T</span>
                            <span className="bubble-char">T</span>
                            <span className="bubble-char">R</span>
                        </span>
                    </span>
                    <div className="om-nav-center">
                        <button className="om-btn-cyan" onClick={() => openNewItem()}>+ NEW ITEM</button>
                        <button className="om-btn-yellow" onClick={handleNewOutfit}>+ NEW OUTFIT</button>
                    </div>
                    <button className="om-btn-ghost" onClick={handleLogout}>LOG OUT</button>
                </nav>

                <div className="om-content">
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

                    <div className="om-center">
                        <OutfitPreview getSlotItem={getSlotItem} />
                    </div>

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

                        {catalogTab === 'items' && (
                            <div className="om-tab-content">
                                <input
                                    className="om-tab-search"
                                    placeholder="SEARCH BY NAME, TYPE, TAG..."
                                    value={itemSearch}
                                    onChange={e => setItemSearch(e.target.value)}
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
    onSave: (item: Item, file: File | null) => void; 
    onDelete: (id: string) => void;
    onClose: () => void;
}

function ItemEditModal({ item, isNew, onSave, onDelete, onClose }: ItemEditModalProps) {
    const [name, setName]         = useState(item.name);
    const [type, setType]         = useState(item.type);
    const [notes, setNotes]       = useState(item.notes);
    const [tags, setTags]         = useState(item.tags.join(', '));
    
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewURL, setPreviewURL]     = useState<string | null>(null);
    const [isTrimmingImage, setIsTrimmingImage] = useState(false);

    async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setIsTrimmingImage(true);

            try {
                const trimmedFile = await autoTrimClothingImage(file);
                setSelectedFile(trimmedFile);
                setPreviewURL(URL.createObjectURL(trimmedFile));
            } catch (error) {
                console.error("Auto trim failed:", error);
                setSelectedFile(file);
                setPreviewURL(URL.createObjectURL(file));
            } finally {
                setIsTrimmingImage(false);
            }
        }
    }

    function handleInternalSave() {
        onSave({
            ...item,
            name,
            type,
            notes,
            imageURL: item.imageURL, 
            tags: tags.split(',').map(t => t.trim()).filter(Boolean)
        }, selectedFile);
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

                <div className="om-item-image" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', height: '200px', backgroundColor: '#1a1a1a', borderRadius: '8px', marginBottom: '15px' }}>
                    {previewURL || item.imageURL ? (
                        <img 
                            src={previewURL || item.imageURL} 
                            alt={name} 
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                        />
                    ) : (
                        <div className="om-image-placeholder" style={{ textAlign: 'center' }}>
                            <div style={{ fontSize: '3rem', marginBottom: '10px' }}>
                                {SLOT_EMOJI[type]}
                            </div>
                            <p style={{ margin: 0, fontSize: '0.9rem', color: '#888' }}>No image yet</p>
                        </div>
                    )}
                </div>

                {isTrimmingImage && (
                    <p className="om-trim-status">Auto-trimming image for the model...</p>
                )}

                <div style={{ marginBottom: "15px" }}>
                    <label style={{ fontSize: "0.8rem", color: "#ccc", display: "block", marginBottom: "5px" }}>
                        UPLOAD PHOTO:
                    </label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={onFileChange} 
                        className="om-input"
                        style={{ padding: "5px" }}
                    />
                </div>

                <input className="om-input" value={name} onChange={e => setName(e.target.value)} placeholder="ITEM NAME" />

                <select className="om-input" value={type} onChange={e => setType(e.target.value as Item['type'])}>
                    {ALL_TYPES.map(t => (
                        <option key={t} value={t}>{SLOT_EMOJI[t]} {t}</option>
                    ))}
                </select>

                <input className="om-input" value={tags} onChange={e => setTags(e.target.value)} placeholder="TAGS — comma separated" />
                <textarea className="om-input om-textarea" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Notes (optional)" />

                <div className="om-modal-actions">
                    <button className="om-btn-yellow" onClick={handleInternalSave} disabled={isTrimmingImage}>
                        {isTrimmingImage ? 'TRIMMING...' : selectedFile ? 'UPLOAD & SAVE' : 'SAVE'}
                    </button>
                    {!isNew && (
                        <button className="om-btn-danger" onClick={() => onDelete(item.itemId)}>DELETE</button>
                    )}
                </div>
            </div>
        </div>
    );
}

export default OutfitManagerPage;
