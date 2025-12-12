import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { Folder as FolderIcon, FolderPlus, Trash2, FileText, Search, Pencil, Check } from 'lucide-react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { Paper, Folder } from '../types';
import { PaperCard } from '../components/PaperCard';

export const MyPapers: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [papers, setPapers] = useState<Paper[]>([]);
    const [folders, setFolders] = useState<Folder[]>([]);
    const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [newFolderName, setNewFolderName] = useState('');
    const [showNewFolder, setShowNewFolder] = useState(false);
    const [searchQuery, setSearchQuery] = useState('');
    const [editMode, setEditMode] = useState(false);
    const [editedFolderNames, setEditedFolderNames] = useState<Record<string, string>>({});

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
            .insert({ user_id: user.id, name: newFolderName.trim() })
            .select()
            .single();

        if (data && !error) {
            setFolders([...folders, data]);
            setNewFolderName('');
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
            for (const [folderId, newName] of Object.entries(editedFolderNames)) {
                const folder = folders.find(f => f.id === folderId);
                const nameStr = newName as string;
                if (folder && nameStr.trim() && nameStr !== folder.name) {
                    await supabase
                        .from('folders')
                        .update({ name: nameStr.trim() })
                        .eq('id', folderId);
                }
            }
            // Refresh folders after save
            fetchFolders();
            setEditedFolderNames({});
        } else {
            // Initialize edited names when entering edit mode
            const names: Record<string, string> = {};
            folders.forEach(f => {
                names[f.id] = f.name;
            });
            setEditedFolderNames(names);
        }
        setEditMode(!editMode);
    };

    const handleFolderNameChange = (folderId: string, newName: string) => {
        setEditedFolderNames(prev => ({
            ...prev,
            [folderId]: newName
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
                    <h1 className="font-display text-3xl font-bold text-charcoal">My Papers</h1>
                    <p className="text-gray-500 mt-1">Organize and manage your research library</p>
                </div>
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
                                    <div className="flex gap-2 mt-2">
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

                            {folders.map((folder) => (
                                <div key={folder.id} className="flex items-center gap-1">
                                    {editMode ? (
                                        <>
                                            <div className="flex-1 flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                                                <FolderIcon size={18} className="text-gray-400 flex-shrink-0" />
                                                <input
                                                    type="text"
                                                    value={editedFolderNames[folder.id] || folder.name}
                                                    onChange={(e) => handleFolderNameChange(folder.id, e.target.value)}
                                                    className="flex-1 bg-transparent text-sm font-medium focus:outline-none border-b border-transparent focus:border-sage"
                                                />
                                                <span className="text-xs text-gray-400">{getFolderPaperCount(folder.id)}</span>
                                            </div>
                                            <button
                                                onClick={() => deleteFolder(folder.id)}
                                                className="p-2 hover:bg-red-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </>
                                    ) : (
                                        <button
                                            onClick={() => setSelectedFolder(folder.id)}
                                            className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${selectedFolder === folder.id
                                                ? 'bg-sage/10 text-sage'
                                                : 'text-gray-600 hover:bg-gray-50'
                                                }`}
                                        >
                                            <FolderIcon size={18} />
                                            <span className="flex-1 font-medium text-sm truncate">{folder.name}</span>
                                            <span className="text-xs text-gray-400">{getFolderPaperCount(folder.id)}</span>
                                        </button>
                                    )}
                                </div>
                            ))}
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
                    ) : (
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
                    )}
                </div>
            </div>
        </div>
    );
};
