import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, ExternalLink, Trash2, Loader2, Search, FolderPlus, Folder as FolderIcon, Pencil, Check, Tag, LayoutGrid, List } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { SavedPaper, SavedPaperCategory, FolderColor } from '../types';
import { FOLDER_COLORS, getFolderColorConfig } from './MyPapers';

export const SavedPapers: React.FC = () => {
    const { user } = useAuth();
    const [papers, setPapers] = useState<SavedPaper[]>([]);
    const [categories, setCategories] = useState<SavedPaperCategory[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // Category management
    const [showNewCategory, setShowNewCategory] = useState(false);
    const [newCategoryName, setNewCategoryName] = useState('');
    const [newCategoryColor, setNewCategoryColor] = useState<FolderColor>('gray');
    const [editMode, setEditMode] = useState(false);
    const [editedCategoryNames, setEditedCategoryNames] = useState<Record<string, string>>({});
    const [editedCategoryColors, setEditedCategoryColors] = useState<Record<string, FolderColor>>({});

    // View mode
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('saved-papers-view-mode');
        return (saved === 'list' || saved === 'grid') ? saved : 'grid';
    });

    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('saved-papers-view-mode', mode);
    };

    useEffect(() => {
        if (user) {
            loadCategories();
            loadSavedPapers();
        }
    }, [user]);

    const loadCategories = async () => {
        if (!user) return;

        const { data, error } = await supabase
            .from('saved_paper_categories')
            .select('*')
            .eq('user_id', user.id)
            .order('created_at', { ascending: true });

        if (data && !error) {
            setCategories(data);
        }
    };

    const loadSavedPapers = async () => {
        if (!user) return;

        setLoading(true);
        const { data, error } = await supabase
            .from('saved_papers')
            .select('*')
            .eq('user_id', user.id)
            .order('saved_at', { ascending: false });

        if (error) {
            console.error('Error loading saved papers:', error);
        } else {
            setPapers(data || []);
        }
        setLoading(false);
    };

    const createCategory = async () => {
        if (!newCategoryName.trim() || !user) return;

        const { data, error } = await supabase
            .from('saved_paper_categories')
            .insert({ user_id: user.id, name: newCategoryName.trim(), color: newCategoryColor })
            .select()
            .single();

        if (data && !error) {
            setCategories([...categories, data]);
            setNewCategoryName('');
            setNewCategoryColor('gray');
            setShowNewCategory(false);
        }
    };

    const deleteCategory = async (categoryId: string) => {
        if (!confirm('Delete this category? Papers in this category will be moved to "All Papers".')) return;

        await supabase
            .from('saved_papers')
            .update({ category_id: null })
            .eq('category_id', categoryId);

        await supabase
            .from('saved_paper_categories')
            .delete()
            .eq('id', categoryId);

        setCategories(categories.filter(c => c.id !== categoryId));
        if (selectedCategory === categoryId) {
            setSelectedCategory(null);
        }
        loadSavedPapers();
    };

    const handleDelete = async (paperId: string, openalexId: string) => {
        if (!user) return;

        setDeletingId(paperId);

        try {
            const { error } = await supabase
                .from('saved_papers')
                .delete()
                .eq('user_id', user.id)
                .eq('openalex_id', openalexId);

            if (error) throw error;

            setPapers(prev => prev.filter(p => p.id !== paperId));
        } catch (err) {
            console.error('Error deleting saved paper:', err);
        } finally {
            setDeletingId(null);
        }
    };

    const movePaperToCategory = async (paperId: string, categoryId: string | null) => {
        await supabase
            .from('saved_papers')
            .update({ category_id: categoryId })
            .eq('id', paperId);

        loadSavedPapers();
    };

    const toggleEditMode = async () => {
        if (editMode) {
            // Save changes when exiting edit mode
            for (const category of categories) {
                const newName = editedCategoryNames[category.id];
                const newColor = editedCategoryColors[category.id];
                const updates: { name?: string; color?: FolderColor } = {};

                if (newName && newName.trim() && newName !== category.name) {
                    updates.name = newName.trim();
                }
                if (newColor && newColor !== category.color) {
                    updates.color = newColor;
                }

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('saved_paper_categories')
                        .update(updates)
                        .eq('id', category.id);
                }
            }
            loadCategories();
            setEditedCategoryNames({});
            setEditedCategoryColors({});
        } else {
            const names: Record<string, string> = {};
            const colors: Record<string, FolderColor> = {};
            categories.forEach(c => {
                names[c.id] = c.name;
                colors[c.id] = c.color || 'gray';
            });
            setEditedCategoryNames(names);
            setEditedCategoryColors(colors);
        }
        setEditMode(!editMode);
    };

    const getCategoryPaperCount = (categoryId: string) => {
        return papers.filter(p => p.category_id === categoryId).length;
    };

    // Filter papers
    const displayedPapers = papers
        .filter(paper => selectedCategory === null || paper.category_id === selectedCategory)
        .filter(paper =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    if (loading) {
        return (
            <div className="flex items-center justify-center py-20">
                <div className="text-center">
                    <Loader2 size={48} className="mx-auto text-sage animate-spin mb-4" />
                    <p className="text-gray-500">Loading saved papers...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto pb-12">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-charcoal">Saved Papers</h1>
                    <p className="text-gray-500 mt-1">Papers you've saved for later reading</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-72">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search saved papers..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-sage focus:border-transparent"
                        />
                    </div>
                    {/* View Toggle */}
                    <div className="flex items-center bg-gray-100 rounded-lg p-1">
                        <button
                            onClick={() => handleViewModeChange('grid')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'grid'
                                ? 'bg-white text-sage shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="Grid View"
                        >
                            <LayoutGrid size={18} />
                        </button>
                        <button
                            onClick={() => handleViewModeChange('list')}
                            className={`p-2 rounded-md transition-colors ${viewMode === 'list'
                                ? 'bg-white text-sage shadow-sm'
                                : 'text-gray-500 hover:text-gray-700'
                            }`}
                            title="List View"
                        >
                            <List size={18} />
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* Categories Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-charcoal">Categories</h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setShowNewCategory(true)}
                                    className="p-1.5 hover:bg-sage/10 rounded-lg text-sage transition-colors"
                                    title="New Category"
                                    disabled={editMode}
                                >
                                    <FolderPlus size={18} />
                                </button>
                                <button
                                    onClick={toggleEditMode}
                                    className={`p-1.5 rounded-lg transition-colors ${editMode
                                        ? 'bg-sage text-white hover:bg-sage-dark'
                                        : 'hover:bg-gray-100 text-gray-500'
                                    }`}
                                    title={editMode ? "Done Editing" : "Edit Categories"}
                                >
                                    {editMode ? <Check size={18} /> : <Pencil size={18} />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showNewCategory && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3"
                                >
                                    <input
                                        type="text"
                                        placeholder="Category name..."
                                        value={newCategoryName}
                                        onChange={(e) => setNewCategoryName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && createCategory()}
                                        autoFocus
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                                    />
                                    {/* Color picker */}
                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {FOLDER_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setNewCategoryColor(color.value)}
                                                className={`w-6 h-6 rounded-full ${color.dot} transition-all ${
                                                    newCategoryColor === color.value
                                                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                                        : 'hover:scale-110'
                                                }`}
                                                title={color.value}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={createCategory}
                                            className="flex-1 bg-sage text-white text-xs py-1.5 rounded-lg hover:bg-sage-dark transition-colors"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowNewCategory(false);
                                                setNewCategoryName('');
                                                setNewCategoryColor('gray');
                                            }}
                                            className="flex-1 bg-gray-100 text-gray-600 text-xs py-1.5 rounded-lg hover:bg-gray-200 transition-colors"
                                        >
                                            Cancel
                                        </button>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <nav className="space-y-1">
                            <button
                                onClick={() => !editMode && setSelectedCategory(null)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selectedCategory === null
                                    ? 'bg-sage/10 text-sage'
                                    : 'text-gray-600 hover:bg-gray-50'
                                }`}
                            >
                                <Bookmark size={18} />
                                <span className="flex-1 font-medium text-sm">All Papers</span>
                                <span className="text-xs text-gray-400">{papers.length}</span>
                            </button>

                            {categories.map((category) => {
                                const colorConfig = getFolderColorConfig(editMode ? editedCategoryColors[category.id] : category.color);
                                return (
                                    <div key={category.id} className="flex items-center gap-1">
                                        {editMode ? (
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                                                    <Tag size={18} className={`${colorConfig.icon} flex-shrink-0`} />
                                                    <input
                                                        type="text"
                                                        value={editedCategoryNames[category.id] || category.name}
                                                        onChange={(e) => setEditedCategoryNames(prev => ({
                                                            ...prev,
                                                            [category.id]: e.target.value
                                                        }))}
                                                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-sage"
                                                    />
                                                    <span className="text-xs text-gray-400">{getCategoryPaperCount(category.id)}</span>
                                                    <button
                                                        onClick={() => deleteCategory(category.id)}
                                                        className="p-1 hover:bg-red-50 rounded text-gray-400 hover:text-red-500 transition-colors"
                                                    >
                                                        <Trash2 size={14} />
                                                    </button>
                                                </div>
                                                {/* Color picker in edit mode */}
                                                <div className="flex gap-1 px-3 flex-wrap">
                                                    {FOLDER_COLORS.map(color => (
                                                        <button
                                                            key={color.value}
                                                            onClick={() => setEditedCategoryColors(prev => ({
                                                                ...prev,
                                                                [category.id]: color.value
                                                            }))}
                                                            className={`w-5 h-5 rounded-full ${color.dot} transition-all ${
                                                                (editedCategoryColors[category.id] || category.color) === color.value
                                                                    ? 'ring-2 ring-offset-1 ring-gray-400 scale-110'
                                                                    : 'hover:scale-110'
                                                            }`}
                                                            title={color.value}
                                                        />
                                                    ))}
                                                </div>
                                            </div>
                                        ) : (
                                            <button
                                                onClick={() => setSelectedCategory(category.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selectedCategory === category.id
                                                    ? `${colorConfig.bg} ${colorConfig.text}`
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                            >
                                                <Tag size={18} className={colorConfig.icon} />
                                                <span className="flex-1 font-medium text-sm truncate">{category.name}</span>
                                                <span className="text-xs text-gray-400">{getCategoryPaperCount(category.id)}</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Papers Grid/List */}
                <div className="lg:col-span-3">
                    {displayedPapers.length === 0 ? (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="text-center py-16 bg-gray-50 rounded-2xl"
                        >
                            <div className="inline-flex items-center justify-center w-20 h-20 bg-sage/10 rounded-full mb-6">
                                <Bookmark size={32} className="text-sage" />
                            </div>
                            <p className="text-gray-600 text-lg mb-2">
                                {selectedCategory ? 'No papers in this category' : 'No saved papers yet'}
                            </p>
                            <p className="text-gray-400 max-w-md mx-auto mb-6">
                                {selectedCategory
                                    ? 'Move papers here from All Papers or save new ones from Find Papers.'
                                    : 'Search for papers and save them here for easy access later.'}
                            </p>
                            {!selectedCategory && (
                                <a
                                    href="#/search"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-sage text-white font-medium rounded-xl hover:bg-sage-dark transition-colors"
                                >
                                    <Search size={18} />
                                    Find Papers
                                </a>
                            )}
                        </motion.div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {displayedPapers.map((paper, idx) => {
                                const paperCategory = categories.find(c => c.id === paper.category_id);
                                const categoryColor = paperCategory ? getFolderColorConfig(paperCategory.color) : null;

                                return (
                                    <motion.div
                                        key={paper.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.05 }}
                                        className={`bg-white p-5 rounded-xl border shadow-sm hover:shadow-md transition-shadow flex flex-col h-full ${
                                            categoryColor ? `border-l-4 ${categoryColor.border}` : 'border-gray-100'
                                        }`}
                                    >
                                        {/* Content section - grows to fill space */}
                                        <div className="flex-1">
                                            <h3 className="font-display font-semibold text-charcoal mb-2 hover:text-sage transition-colors line-clamp-2">
                                                <a
                                                    href={paper.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="flex items-start gap-2"
                                                >
                                                    <span>{paper.title}</span>
                                                    <ExternalLink size={14} className="flex-shrink-0 mt-1 text-gray-400" />
                                                </a>
                                            </h3>
                                            <p className="text-sm text-gray-500 mb-2 line-clamp-1">
                                                {paper.authors.join(', ')}
                                            </p>
                                            {paper.abstract && (
                                                <p className="text-gray-600 text-sm line-clamp-2">
                                                    {paper.abstract}
                                                </p>
                                            )}
                                        </div>
                                        {/* Footer - always at bottom */}
                                        <div className="flex items-center justify-between pt-3 mt-3 border-t border-gray-50">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded">
                                                    {paper.source}
                                                </span>
                                                {paper.published_date && (
                                                    <span className="text-xs text-gray-400">
                                                        {paper.published_date}
                                                    </span>
                                                )}
                                            </div>
                                            <div className="flex items-center gap-1">
                                                {/* Category dropdown */}
                                                <select
                                                    value={paper.category_id || ''}
                                                    onChange={(e) => movePaperToCategory(paper.id, e.target.value || null)}
                                                    className="text-xs bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sage"
                                                >
                                                    <option value="">No category</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                                <button
                                                    onClick={() => handleDelete(paper.id, paper.openalex_id)}
                                                    disabled={deletingId === paper.id}
                                                    className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Remove from saved"
                                                >
                                                    {deletingId === paper.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </motion.div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* List Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-5">Title</div>
                                <div className="col-span-3">Authors</div>
                                <div className="col-span-2">Category</div>
                                <div className="col-span-2 text-right">Actions</div>
                            </div>
                            {/* List Items */}
                            <div className="divide-y divide-gray-50">
                                {displayedPapers.map((paper) => {
                                    const paperCategory = categories.find(c => c.id === paper.category_id);
                                    const categoryColor = paperCategory ? getFolderColorConfig(paperCategory.color) : null;

                                    return (
                                        <motion.div
                                            key={paper.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors ${
                                                categoryColor ? `border-l-4 ${categoryColor.border}` : ''
                                            }`}
                                        >
                                            <div className="col-span-5 min-w-0">
                                                <a
                                                    href={paper.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="font-medium text-charcoal hover:text-sage transition-colors truncate block"
                                                >
                                                    {paper.title}
                                                </a>
                                                <span className="text-xs text-gray-400">
                                                    {paper.source} {paper.published_date && `• ${paper.published_date}`}
                                                </span>
                                            </div>
                                            <div className="col-span-3 text-sm text-gray-500 truncate">
                                                {paper.authors.slice(0, 2).join(', ')}
                                                {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
                                            </div>
                                            <div className="col-span-2">
                                                <select
                                                    value={paper.category_id || ''}
                                                    onChange={(e) => movePaperToCategory(paper.id, e.target.value || null)}
                                                    className="text-xs w-full bg-transparent border border-gray-200 rounded px-2 py-1 focus:outline-none focus:ring-1 focus:ring-sage"
                                                >
                                                    <option value="">None</option>
                                                    {categories.map(cat => (
                                                        <option key={cat.id} value={cat.id}>{cat.name}</option>
                                                    ))}
                                                </select>
                                            </div>
                                            <div className="col-span-2 flex items-center justify-end gap-1">
                                                <a
                                                    href={paper.url}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="p-1.5 rounded-lg hover:bg-sage/10 text-gray-400 hover:text-sage transition-colors"
                                                    title="Open Paper"
                                                >
                                                    <ExternalLink size={16} />
                                                </a>
                                                <button
                                                    onClick={() => handleDelete(paper.id, paper.openalex_id)}
                                                    disabled={deletingId === paper.id}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Remove"
                                                >
                                                    {deletingId === paper.id ? (
                                                        <Loader2 size={16} className="animate-spin" />
                                                    ) : (
                                                        <Trash2 size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};
