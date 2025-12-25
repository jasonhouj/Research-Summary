import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Folder as FolderIcon, FolderPlus, Trash2, FileText, Search, Pencil, Check, LayoutGrid, List, Eye, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Paper, Folder, FolderColor } from '../types';
import { PaperCard } from '../components/PaperCard';

// Folder color configuration
export const FOLDER_COLORS: { value: FolderColor; bg: string; text: string; icon: string; border: string; dot: string }[] = [
    { value: 'gray', bg: 'bg-gray-100', text: 'text-gray-600', icon: 'text-gray-500', border: 'border-gray-300', dot: 'bg-gray-400' },
    { value: 'red', bg: 'bg-red-100', text: 'text-red-600', icon: 'text-red-500', border: 'border-red-300', dot: 'bg-red-500' },
    { value: 'orange', bg: 'bg-orange-100', text: 'text-orange-600', icon: 'text-orange-500', border: 'border-orange-300', dot: 'bg-orange-500' },
    { value: 'amber', bg: 'bg-amber-100', text: 'text-amber-600', icon: 'text-amber-500', border: 'border-amber-300', dot: 'bg-amber-500' },
    { value: 'green', bg: 'bg-green-100', text: 'text-green-600', icon: 'text-green-500', border: 'border-green-300', dot: 'bg-green-500' },
    { value: 'teal', bg: 'bg-teal-100', text: 'text-teal-600', icon: 'text-teal-500', border: 'border-teal-300', dot: 'bg-teal-500' },
    { value: 'blue', bg: 'bg-blue-100', text: 'text-blue-600', icon: 'text-blue-500', border: 'border-blue-300', dot: 'bg-blue-500' },
    { value: 'purple', bg: 'bg-purple-100', text: 'text-purple-600', icon: 'text-purple-500', border: 'border-purple-300', dot: 'bg-purple-500' },
    { value: 'pink', bg: 'bg-pink-100', text: 'text-pink-600', icon: 'text-pink-500', border: 'border-pink-300', dot: 'bg-pink-500' },
];

export const getFolderColorConfig = (color: FolderColor | undefined) => {
    return FOLDER_COLORS.find(c => c.value === color) || FOLDER_COLORS[0];
};

export const MyPapers: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [papers, setPapers] = useState<Paper[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newFolderName, setNewFolderName] = useState('');
    const [newFolderColor, setNewFolderColor] = useState<FolderColor>('gray');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editedFolderNames, setEditedFolderNames] = useState<Record<string, string>>({});
    const [editedFolderColors, setEditedFolderColors] = useState<Record<string, FolderColor>>({});
    const [viewMode, setViewMode] = useState<'grid' | 'list'>(() => {
        const saved = localStorage.getItem('summaries-view-mode');
        return (saved === 'list' || saved === 'grid') ? saved : 'grid';
    });

    // Persist view mode preference
    const handleViewModeChange = (mode: 'grid' | 'list') => {
        setViewMode(mode);
        localStorage.setItem('summaries-view-mode', mode);
    };

    useEffect(() => {
        if (user) {
            fetchFolders();
            fetchPapers();
        }
    }, [user]);

    const fetchFolders = async () => {
        const { data, error } = await supabase
            .from('folders')
            .select('*')
            .eq('user_id', user?.id)
            .order('created_at', { ascending: true });

        if (data && !error) {
            setFolders(data);
        }
    };

    const fetchPapers = async () => {
        setLoading(true);
        const { data, error } = await supabase
            .from('papers')
            .select('*')
            .eq('user_id', user?.id)
            .order('upload_date', { ascending: false });

        if (data && !error) {
            setPapers(data.map(p => ({
                ...p,
                authors: p.authors || []
            })));
        }
        setLoading(false);
    };

    const createFolder = async () => {
        if (!newFolderName.trim() || !user) return;

        const { data, error } = await supabase
            .from('folders')
            .insert({ user_id: user.id, name: newFolderName.trim(), color: newFolderColor })
            .select()
            .single();

        if (data && !error) {
            setFolders([...folders, data]);
            setNewFolderName('');
            setNewFolderColor('gray');
            setShowNewFolder(false);
        }
    };

    const deleteFolder = async (folderId: string) => {
        if (!confirm('Delete this folder? Papers in this folder will be moved to "All Papers".')) return;

        await supabase
            .from('papers')
            .update({ folder_id: null })
            .eq('folder_id', folderId);

        await supabase
            .from('folders')
            .delete()
            .eq('id', folderId);

        setFolders(folders.filter(f => f.id !== folderId));
        if (selectedFolder === folderId) {
            setSelectedFolder(null);
        }
    };

    const deletePaper = async (paperId: string) => {
        if (!confirm('Delete this paper? This action cannot be undone.')) return;

        const { error } = await supabase
            .from('papers')
            .delete()
            .eq('id', paperId)
            .eq('user_id', user?.id);

        if (!error) {
            setPapers(papers.filter(p => p.id !== paperId));
        } else {
            console.error('Error deleting paper:', error);
            alert('Failed to delete paper. Please try again.');
        }
    };

    const handleView = (id: string) => {
        navigate(`/paper/${id}`);
    };

    const movePaperToFolder = async (paperId: string, folderId: string | null) => {
        await supabase
            .from('papers')
            .update({ folder_id: folderId })
            .eq('id', paperId);

        fetchPapers();
    };

    const toggleEditMode = async () => {
        if (editMode) {
            // Save changes when exiting edit mode
            for (const folder of folders) {
                const newName = editedFolderNames[folder.id];
                const newColor = editedFolderColors[folder.id];
                const updates: { name?: string; color?: FolderColor } = {};

                if (newName && newName.trim() && newName !== folder.name) {
                    updates.name = newName.trim();
                }
                if (newColor && newColor !== folder.color) {
                    updates.color = newColor;
                }

                if (Object.keys(updates).length > 0) {
                    await supabase
                        .from('folders')
                        .update(updates)
                        .eq('id', folder.id);
                }
            }
            // Refresh folders after save
            fetchFolders();
            setEditedFolderNames({});
            setEditedFolderColors({});
        } else {
            // Initialize edited values when entering edit mode
            const names: Record<string, string> = {};
            const colors: Record<string, FolderColor> = {};
            folders.forEach(f => {
                names[f.id] = f.name;
                colors[f.id] = f.color || 'gray';
            });
            setEditedFolderNames(names);
            setEditedFolderColors(colors);
        }
        setEditMode(!editMode);
    };

    const handleFolderNameChange = (folderId: string, newName: string) => {
        setEditedFolderNames(prev => ({
            ...prev,
            [folderId]: newName
        }));
    };

    const handleFolderColorChange = (folderId: string, newColor: FolderColor) => {
        setEditedFolderColors(prev => ({
            ...prev,
            [folderId]: newColor
        }));
    };

    // Filter by selected folder first, then by search query
    const displayedPapers = papers
        .filter(paper => selectedFolder === null || paper.folder_id === selectedFolder)
        .filter(paper =>
            paper.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
            paper.authors.some(a => a.toLowerCase().includes(searchQuery.toLowerCase()))
        );

    const getFolderPaperCount = (folderId: string) => {
        return papers.filter(p => p.folder_id === folderId).length;
    };

    return (
        <div className="max-w-7xl mx-auto pb-12">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="font-display text-3xl font-bold text-charcoal">My Summaries</h1>
                    <p className="text-gray-500 mt-1">Organize and manage your research library</p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="relative w-72">
                        <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Search papers..."
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
                {/* Folders Sidebar */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="font-semibold text-charcoal">Folders</h3>
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => setShowNewFolder(true)}
                                    className="p-1.5 hover:bg-sage/10 rounded-lg text-sage transition-colors"
                                    title="New Folder"
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
                                    title={editMode ? "Done Editing" : "Edit Folders"}
                                >
                                    {editMode ? <Check size={18} /> : <Pencil size={18} />}
                                </button>
                            </div>
                        </div>

                        <AnimatePresence>
                            {showNewFolder && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="mb-3"
                                >
                                    <input
                                        type="text"
                                        placeholder="Folder name..."
                                        value={newFolderName}
                                        onChange={(e) => setNewFolderName(e.target.value)}
                                        onKeyDown={(e) => e.key === 'Enter' && createFolder()}
                                        autoFocus
                                        className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-sage"
                                    />
                                    {/* Color picker */}
                                    <div className="flex gap-1.5 mt-2 flex-wrap">
                                        {FOLDER_COLORS.map(color => (
                                            <button
                                                key={color.value}
                                                onClick={() => setNewFolderColor(color.value)}
                                                className={`w-6 h-6 rounded-full ${color.dot} transition-all ${
                                                    newFolderColor === color.value
                                                        ? 'ring-2 ring-offset-2 ring-gray-400 scale-110'
                                                        : 'hover:scale-110'
                                                }`}
                                                title={color.value}
                                            />
                                        ))}
                                    </div>
                                    <div className="flex gap-2 mt-3">
                                        <button
                                            onClick={createFolder}
                                            className="flex-1 bg-sage text-white text-xs py-1.5 rounded-lg hover:bg-sage-dark transition-colors"
                                        >
                                            Create
                                        </button>
                                        <button
                                            onClick={() => {
                                                setShowNewFolder(false);
                                                setNewFolderName('');
                                                setNewFolderColor('gray');
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
                                onClick={() => !editMode && setSelectedFolder(null)}
                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selectedFolder === null
                                    ? 'bg-sage/10 text-sage'
                                    : 'text-gray-600 hover:bg-gray-50'
                                    }`}
                            >
                                <FileText size={18} />
                                <span className="flex-1 font-medium text-sm">All Papers</span>
                                <span className="text-xs text-gray-400">{papers.length}</span>
                            </button>

                            {folders.map((folder) => {
                                const colorConfig = getFolderColorConfig(editMode ? editedFolderColors[folder.id] : folder.color);
                                return (
                                    <div key={folder.id} className="flex items-center gap-1">
                                        {editMode ? (
                                            <div className="flex-1 space-y-2">
                                                <div className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                                                    <FolderIcon size={18} className={`${colorConfig.icon} flex-shrink-0`} />
                                                    <input
                                                        type="text"
                                                        value={editedFolderNames[folder.id] || folder.name}
                                                        onChange={(e) => handleFolderNameChange(folder.id, e.target.value)}
                                                        className="flex-1 bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-sage"
                                                    />
                                                    <span className="text-xs text-gray-400">{getFolderPaperCount(folder.id)}</span>
                                                    <button
                                                        onClick={() => deleteFolder(folder.id)}
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
                                                            onClick={() => handleFolderColorChange(folder.id, color.value)}
                                                            className={`w-5 h-5 rounded-full ${color.dot} transition-all ${
                                                                (editedFolderColors[folder.id] || folder.color) === color.value
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
                                                onClick={() => setSelectedFolder(folder.id)}
                                                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selectedFolder === folder.id
                                                    ? `${colorConfig.bg} ${colorConfig.text}`
                                                    : 'text-gray-600 hover:bg-gray-50'
                                                    }`}
                                            >
                                                <FolderIcon size={18} className={colorConfig.icon} />
                                                <span className="flex-1 font-medium text-sm truncate">{folder.name}</span>
                                                <span className="text-xs text-gray-400">{getFolderPaperCount(folder.id)}</span>
                                            </button>
                                        )}
                                    </div>
                                );
                            })}
                        </nav>
                    </div>
                </div>

                {/* Papers Grid */}
                <div className="lg:col-span-3">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Loading papers...</div>
                    ) : displayedPapers.length === 0 ? (
                        <div className="text-center py-20">
                            <FileText size={48} className="mx-auto text-gray-300 mb-4" />
                            <p className="text-gray-500">No papers found</p>
                            <p className="text-sm text-gray-400 mt-1">
                                {selectedFolder ? 'This folder is empty' : 'Upload papers from the Dashboard to get started'}
                            </p>
                        </div>
                    ) : viewMode === 'grid' ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                            {displayedPapers.map((paper) => (
                                <PaperCard
                                    key={paper.id}
                                    paper={paper}
                                    onView={handleView}
                                    onDelete={() => deletePaper(paper.id)}
                                    folders={folders}
                                    onMoveToFolder={(folderId) => movePaperToFolder(paper.id, folderId)}
                                />
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm overflow-hidden">
                            {/* List Header */}
                            <div className="grid grid-cols-12 gap-4 px-6 py-3 bg-gray-50 border-b border-gray-100 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                <div className="col-span-5">Title</div>
                                <div className="col-span-3">Authors</div>
                                <div className="col-span-2">Date</div>
                                <div className="col-span-1">Status</div>
                                <div className="col-span-1 text-right">Actions</div>
                            </div>
                            {/* List Items */}
                            <div className="divide-y divide-gray-50">
                                {displayedPapers.map((paper) => {
                                    const paperFolder = folders.find(f => f.id === paper.folder_id);
                                    const folderColor = paperFolder ? getFolderColorConfig(paperFolder.color) : null;
                                    const statusConfig = {
                                        pending: { icon: Clock, text: 'text-amber-500', label: 'Pending' },
                                        processing: { icon: Clock, text: 'text-blue-500', label: 'Processing' },
                                        completed: { icon: CheckCircle2, text: 'text-green-500', label: 'Completed' },
                                        failed: { icon: AlertCircle, text: 'text-red-500', label: 'Failed' },
                                    };
                                    const status = statusConfig[paper.status];
                                    const StatusIcon = status.icon;

                                    return (
                                        <motion.div
                                            key={paper.id}
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className={`grid grid-cols-12 gap-4 px-6 py-4 items-center hover:bg-gray-50 transition-colors cursor-pointer group ${folderColor ? `border-l-4 ${folderColor.border}` : ''}`}
                                            onClick={() => paper.status === 'completed' && handleView(paper.id)}
                                        >
                                            <div className="col-span-5 flex items-center gap-3 min-w-0">
                                                <div className={`p-2 rounded-md flex-shrink-0 ${folderColor ? `${folderColor.bg} ${folderColor.icon}` : 'bg-gray-100 text-gray-500'}`}>
                                                    <FileText size={16} />
                                                </div>
                                                <span className="font-medium text-charcoal truncate group-hover:text-sage transition-colors">
                                                    {paper.title}
                                                </span>
                                            </div>
                                            <div className="col-span-3 text-sm text-gray-500 truncate">
                                                {paper.authors.slice(0, 2).join(', ')}
                                                {paper.authors.length > 2 && ` +${paper.authors.length - 2}`}
                                            </div>
                                            <div className="col-span-2 text-sm text-gray-400">
                                                {new Date(paper.upload_date).toLocaleDateString()}
                                            </div>
                                            <div className="col-span-1">
                                                <div className={`flex items-center gap-1 text-xs font-medium ${status.text}`}>
                                                    <StatusIcon size={14} />
                                                    <span className="hidden xl:inline">{status.label}</span>
                                                </div>
                                            </div>
                                            <div className="col-span-1 flex items-center justify-end gap-1">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleView(paper.id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-sage/10 text-gray-400 hover:text-sage transition-colors"
                                                    title="View Summary"
                                                    disabled={paper.status !== 'completed'}
                                                >
                                                    <Eye size={16} />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        deletePaper(paper.id);
                                                    }}
                                                    className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors"
                                                    title="Delete Paper"
                                                >
                                                    <Trash2 size={16} />
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
