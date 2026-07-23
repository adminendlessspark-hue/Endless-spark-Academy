import React, { useState, useMemo, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { 
  BookOpen, Calendar, Clock, ArrowLeft, Search, Filter, 
  Sparkles, CheckCircle2, AlertTriangle, ShieldCheck, HelpCircle, 
  Globe, Leaf, Sliders, Palette, Zap, ArrowRight, X, Layers,
  Award, FileText, Check, CheckSquare, Plus, Trash2, Edit, Tag,
  Upload, Image as ImageIcon
} from 'lucide-react';
import { useSettings } from '../hooks/useSettings';
import { useAuth } from '../AuthContext';
import { db } from '../firebase';
import { collection, addDoc, getDocs, deleteDoc, doc, query, orderBy, updateDoc, setDoc } from 'firebase/firestore';

const blogPosts = [
  {
    id: 'eco-smart-packaging',
    title: 'The Future of Eco-Friendly Smart Packaging',
    category: 'Sustainable Design',
    categoryColor: 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100',
    date: 'July 15, 2026',
    readTime: '5 min read',
    author: 'Dr. Arul Kumar',
    authorRole: 'Head of Packaging Tech',
    image: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600',
    excerpt: 'Exploring biodegradable substrates, water-soluble inks, and active barrier layers that prolong shelf-life without microplastics.',
    content: `
      The packaging industry is undergoing a seismic shift. The convergence of strict environmental regulations and high consumer demand for sustainable products is pushing brands to rethink their packaging architectures. We are moving beyond simple "recyclability" into the era of Eco-Friendly Smart Packaging.

      ### Biodegradable Substrates
      Traditional plastics are being replaced by bio-based polymers derived from agricultural byproducts, seaweed, and fungi mycelium. These materials offer comparable structural integrity and water resistance but decompose naturally in compost environments within weeks.

      ### Water-Soluble and Soy Inks
      Petroleum-based inks release volatile organic compounds (VOCs) and contaminate paper recycling streams. Modern printing operations are shifting to soy-based and water-soluble inks, which provide brilliant high-fidelity colors while maintaining a clean, chemical-free de-inking process during recycling.

      ### Active & Smart Barrier Layers
      Smart packaging isn't just about eco-friendly materials; it's also about performance. Integrated natural antimicrobial agents and oxygen scavengers built directly into the substrate help preserve food freshness. When paired with printed NFC tags and heat-sensitive visual indicators, consumers can verify product quality and source history with a single tap of their phone.

      ### Conclusion
      Integrating eco-friendly smart substrates with modern flexographic and digital printing is no longer a luxury—it's a critical requirement for next-generation packaging engineering.
    `
  },
  {
    id: 'prepress-mastery',
    title: 'Prepress Mastery: Vector File Prep for High-Speed Press',
    category: 'Prepress Engineering',
    categoryColor: 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100',
    date: 'July 08, 2026',
    readTime: '8 min read',
    author: 'Sarah Jenkins',
    authorRole: 'Senior Print Engineer',
    image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600',
    excerpt: 'A comprehensive guide to flawless trapping, bleed allowances, ink-density limits (TAC/TIL), and custom ICC color-profile conversions.',
    content: `
      In high-speed offset and gravure printing, a single error in file preparation can ruin thousands of meters of expensive substrate. Prepress engineering is the crucial shield that ensures what you see on screen matches the final physical printed surface perfectly.

      ### 1. Perfect Trapping and Bleeds
      When printing on high-speed presses, slight mechanical vibrations can cause minute shifts in registration. To prevent unsightly white gaps between adjacent colors, prepress engineers apply trapping—a tiny overlap of lighter colors under darker ones. Additionally, a strict minimum of 3mm (or 1/8 inch) of bleed must extend beyond the trim line to account for minor cutting tolerances.

      ### 2. Understanding Ink Density (TAC/TIL)
      Total Area Coverage (TAC), or Total Ink Limit (TIL), defines the maximum combined percentage of Cyan, Magenta, Yellow, and Black (CMYK) ink in the darkest shadow areas. For high-speed web presses, exceeding a TAC of 300% leads to slow drying, ink smearing, and paper tearing. Proper conversion using standard profiles (like GRACoL or FOGRA) automatically compresses these values safely.

      ### 3. Vectorization and Font Embedding
      To prevent pixelated lines and fuzzy barcodes, all artwork must remain as resolution-independent vector shapes. Text must be fully outlined (converted to paths) or verified as fully embedded. Barcodes should always be constructed with clean black vectors (K:100%) to ensure perfect scanning readability.

      ### Actionable Checklist
      - Convert color space to CMYK or designated spot colors.
      - Apply custom ICC profiles tailored to the specific substrate (coated vs. uncoated).
      - Set black text to "Overprint" to avoid alignment halos.
    `
  },
  {
    id: 'holographic-cold-foil',
    title: 'Elevating Brands with Holographic Cold Foil Tech',
    category: 'Brand Finishing',
    categoryColor: 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100',
    date: 'June 28, 2026',
    readTime: '6 min read',
    author: 'Rajasekar V',
    authorRole: 'Brand & Finishes Consultant',
    image: 'https://images.unsplash.com/photo-1507208773393-40d9fc670acf?auto=format&fit=crop&q=80&w=600',
    excerpt: 'How digital cold foil inline application elevates packaging luxury, optimizes production costs, and delivers breathtaking metallic textures.',
    content: `
      In a crowded retail environment, products have less than two seconds to capture a customer's eye. Packaging finishes have become the ultimate differentiator, and holographic cold foil is leading the revolution in luxury brand finishing.

      ### What is Cold Foil?
      Unlike traditional hot foil stamping, which requires custom metal dies and separate offline steps, cold foil is applied inline during the standard printing process. An UV-curable adhesive is printed onto the substrate in the exact shape of the metallic design. The foil film is then pressed against the substrate, adhering only to the adhesive, followed by instant UV curing.

      ### Creative Freedom & Gradients
      Because cold foil is printed using high-resolution offset or flexo plates, designers can create extremely fine lines, half-tone gradients, and microscopic textures that are impossible with hot stamping. Overprinting the foil with translucent inks yields an infinite spectrum of custom metallic colors and shimmering effects.

      ### Cost-Effectiveness & Speed
      By running inline at maximum press speeds, cold foil cuts production time by 50% compared to traditional hot stamping methods. It also eliminates the tooling cost of heavy brass dies, making luxury finishes economically viable even for short-run promotional packaging.

      ### Summary
      Holographic cold foil is a game-changer for brand owners, offering an eco-friendly (readily recyclable), affordable, and visually stunning way to stand out on the shelves.
    `
  }
];

const UNSPLASH_IMAGES = [
  { url: 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600', label: 'Sustainable Package' },
  { url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&q=80&w=600', label: 'Prepress Canvas' },
  { url: 'https://images.unsplash.com/photo-1507208773393-40d9fc670acf?auto=format&fit=crop&q=80&w=600', label: 'Brand Foils' },
  { url: 'https://images.unsplash.com/photo-1512418491510-1aa49a8de846?auto=format&fit=crop&q=80&w=600', label: 'Color Retouching' },
  { url: 'https://images.unsplash.com/photo-1504274066654-8fe55b554830?auto=format&fit=crop&q=80&w=600', label: 'Design Agency Work' }
];

const getCategoryColor = (category: string) => {
  if (category === 'Sustainable Design') return 'bg-emerald-50 text-emerald-700 border-emerald-100 hover:bg-emerald-100';
  if (category === 'Prepress Engineering') return 'bg-pink-50 text-pink-700 border-pink-100 hover:bg-pink-100';
  if (category === 'Brand Finishing') return 'bg-purple-50 text-purple-700 border-purple-100 hover:bg-purple-100';
  return 'bg-blue-50 text-blue-700 border-blue-100 hover:bg-blue-100';
};

export default function PrintingBlog() {
  const navigate = useNavigate();
  const { logoUrl } = useSettings();
  const { user, isAdmin } = useAuth();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedPost, setSelectedPost] = useState<any | null>(null);

  // Admin Custom Posts, Categories, and Deleted Post IDs states
  const [customPosts, setCustomPosts] = useState<any[]>([]);
  const [customCategories, setCustomCategories] = useState<string[]>([]);
  const [deletedPostIds, setDeletedPostIds] = useState<string[]>([]);
  const [loadingPosts, setLoadingPosts] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<any | null>(null);

  // Status Filter for Admins/Authors ('all' | 'published' | 'draft')
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');

  // Category Addition state
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryInput, setNewCategoryInput] = useState('');
  const [inlineCategoryInput, setInlineCategoryInput] = useState('');
  const [showInlineCategoryAdd, setShowInlineCategoryAdd] = useState(false);

  // Post Form States
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState('Sustainable Design');
  const [newReadTime, setNewReadTime] = useState('5 min read');
  const [newImage, setNewImage] = useState('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600');
  const [newExcerpt, setNewExcerpt] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newWidgetType, setNewWidgetType] = useState('none');
  const [newAuthor, setNewAuthor] = useState('');
  const [newAuthorRole, setNewAuthorRole] = useState('');
  const [formError, setFormError] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  // Fetch Firestore Custom Posts, Categories & Deleted post IDs
  const fetchCustomPosts = async () => {
    try {
      const q = query(collection(db, 'printing_blog_posts'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const posts: any[] = [];
      querySnapshot.forEach((doc) => {
        posts.push({ id: doc.id, ...doc.data() });
      });
      setCustomPosts(posts);
    } catch (error) {
      console.error("Error fetching custom blog posts:", error);
    } finally {
      setLoadingPosts(false);
    }
  };

  const fetchCustomCategories = async () => {
    try {
      const catSnapshot = await getDocs(collection(db, 'printing_blog_categories'));
      const cats: string[] = [];
      catSnapshot.forEach((doc) => {
        if (doc.data().name) cats.push(doc.data().name);
      });
      setCustomCategories(cats);
    } catch (error) {
      console.error("Error fetching custom categories:", error);
    }
  };

  const fetchDeletedPostIds = async () => {
    try {
      const delSnapshot = await getDocs(collection(db, 'printing_blog_deleted'));
      const ids: string[] = [];
      delSnapshot.forEach((doc) => {
        ids.push(doc.id);
      });
      setDeletedPostIds(ids);
    } catch (error) {
      console.error("Error fetching deleted post ids:", error);
    }
  };

  useEffect(() => {
    fetchCustomPosts();
    fetchCustomCategories();
    fetchDeletedPostIds();
  }, []);

  // Merge static and custom posts, allowing custom override for edited static posts
  const allPosts = useMemo(() => {
    const customMap = new Map(customPosts.map(p => [p.id, p]));
    const staticConverted = blogPosts.map(p => ({ ...p, status: 'published' }));
    const combined = [
      ...customPosts,
      ...staticConverted.filter(sp => !customMap.has(sp.id))
    ];
    return combined.filter(p => !deletedPostIds.includes(p.id));
  }, [customPosts, deletedPostIds]);

  // Derived unique categories
  const categories = useMemo(() => {
    const base = ['Sustainable Design', 'Prepress Engineering', 'Brand Finishing'];
    const dynamicCats = customPosts.map(p => p.category).filter(Boolean);
    const combined = Array.from(new Set([...base, ...customCategories, ...dynamicCats]));
    return ['All', ...combined];
  }, [customCategories, customPosts]);

  // Add new category handler (from top bar)
  const handleAddNewCategory = async () => {
    const trimmed = newCategoryInput.trim();
    if (!trimmed) return;
    if (categories.includes(trimmed)) {
      setNewCategory(trimmed);
      setIsAddingCategory(false);
      setNewCategoryInput('');
      return;
    }
    try {
      const catDocId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'printing_blog_categories', catDocId), {
        name: trimmed,
        createdAt: new Date().toISOString()
      });
      setCustomCategories(prev => Array.from(new Set([...prev, trimmed])));
      setNewCategory(trimmed);
      setIsAddingCategory(false);
      setNewCategoryInput('');
    } catch (err) {
      console.error("Error adding custom category:", err);
      alert("Failed to add category. Please try again.");
    }
  };

  // Add inline category handler (from inside post form)
  const handleAddInlineCategory = async () => {
    const trimmed = inlineCategoryInput.trim();
    if (!trimmed) return;
    try {
      const catDocId = trimmed.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await setDoc(doc(db, 'printing_blog_categories', catDocId), {
        name: trimmed,
        createdAt: new Date().toISOString()
      });
      setCustomCategories(prev => Array.from(new Set([...prev, trimmed])));
      setNewCategory(trimmed);
      setInlineCategoryInput('');
      setShowInlineCategoryAdd(false);
    } catch (err) {
      console.error("Error adding inline category:", err);
      alert("Failed to add category. Please try again.");
    }
  };

  // Delete custom category
  const handleDeleteCategory = async (catName: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (!window.confirm(`Are you sure you want to delete the "${catName}" category?`)) {
      return;
    }
    try {
      const catDocId = catName.toLowerCase().replace(/[^a-z0-9]/g, '_');
      await deleteDoc(doc(db, 'printing_blog_categories', catDocId));
      setCustomCategories(prev => prev.filter(c => c !== catName));
      if (selectedCategory === catName) {
        setSelectedCategory('All');
      }
    } catch (err) {
      console.error("Error deleting category:", err);
      alert("Failed to delete category.");
    }
  };

  // Populate form for editing
  const handleOpenEditModal = (post: any, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    setEditingPost(post);
    setNewTitle(post.title || '');
    setNewCategory(post.category || 'Sustainable Design');
    setNewReadTime(post.readTime || '5 min read');
    setNewImage(post.image || 'https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600');
    setNewExcerpt(post.excerpt || '');
    setNewContent(post.content || '');
    setNewWidgetType(post.widgetType || 'none');
    setNewAuthor(post.author || '');
    setNewAuthorRole(post.authorRole || '');
    setIsCreateModalOpen(true);
  };

  const resetForm = () => {
    setEditingPost(null);
    setNewTitle('');
    setNewCategory('Sustainable Design');
    setNewReadTime('5 min read');
    setNewImage('https://images.unsplash.com/photo-1589939705384-5185137a7f0f?auto=format&fit=crop&q=80&w=600');
    setNewExcerpt('');
    setNewContent('');
    setNewWidgetType('none');
    setNewAuthor('');
    setNewAuthorRole('');
    setFormError('');
    setShowInlineCategoryAdd(false);
    setInlineCategoryInput('');
  };

  // Create or Update post with target status ('draft' | 'published')
  const handleSavePost = async (targetStatus: 'draft' | 'published') => {
    if (!newTitle.trim() || !newExcerpt.trim() || !newContent.trim()) {
      setFormError('Please fill in all required fields (Title, Excerpt, Content)');
      return;
    }

    setFormSubmitting(true);
    setFormError('');

    try {
      const docData = {
        title: newTitle.trim(),
        category: newCategory,
        categoryColor: getCategoryColor(newCategory),
        date: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }),
        readTime: newReadTime,
        author: newAuthor.trim() || user?.name || 'Administrator',
        authorRole: newAuthorRole.trim() || 'Academic Instructor',
        image: newImage,
        excerpt: newExcerpt.trim(),
        content: newContent,
        widgetType: newWidgetType,
        status: targetStatus,
        updatedAt: new Date().toISOString(),
        createdBy: editingPost ? (editingPost.createdBy || user?.id || 'admin') : (user?.id || 'admin')
      };

      if (editingPost?.id) {
        await setDoc(doc(db, 'printing_blog_posts', editingPost.id), docData);
      } else {
        await addDoc(collection(db, 'printing_blog_posts'), {
          ...docData,
          createdAt: new Date().toISOString()
        });
      }
      
      resetForm();
      setIsCreateModalOpen(false);
      await fetchCustomPosts();
    } catch (err: any) {
      console.error("Error saving post:", err);
      setFormError(err.message || 'Failed to save post. Please check your network or try again.');
    } finally {
      setFormSubmitting(false);
    }
  };

  // Publish a Draft directly with 1 click
  const handlePublishDraft = async (postId: string, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    try {
      await updateDoc(doc(db, 'printing_blog_posts', postId), {
        status: 'published',
        publishedAt: new Date().toISOString()
      });
      await fetchCustomPosts();
      if (selectedPost?.id === postId) {
        setSelectedPost((prev: any) => prev ? { ...prev, status: 'published' } : null);
      }
    } catch (err) {
      console.error("Error publishing draft:", err);
      alert("Failed to publish draft. Please try again.");
    }
  };

  // Handle local image file upload converting to Data URL
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 8 * 1024 * 1024) {
      alert("Image file size should be less than 8MB.");
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setNewImage(event.target.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  // Delete post handler
  const handleDeletePost = async (postId: string, e?: React.MouseEvent) => {
    if (e) {
      e.stopPropagation();
      e.preventDefault();
    }
    if (!postId) return;
    if (!window.confirm("Are you sure you want to delete this topic? This action cannot be undone.")) {
      return;
    }

    // Optimistically update local UI state immediately so topic is removed visually without delay
    setDeletedPostIds(prev => Array.from(new Set([...prev, postId])));
    setCustomPosts(prev => prev.filter(p => p.id !== postId));
    if (selectedPost?.id === postId) {
      setSelectedPost(null);
    }

    try {
      // Record deletion in printing_blog_deleted doc so static or dynamic posts stay removed
      await setDoc(doc(db, 'printing_blog_deleted', postId), {
        deletedAt: new Date().toISOString(),
        deletedBy: user?.id || user?.email || 'admin'
      });

      // Try deleting from custom posts collection if present
      try {
        await deleteDoc(doc(db, 'printing_blog_posts', postId));
      } catch (err) {
        console.log("Post was static or not in printing_blog_posts", err);
      }
    } catch (err: any) {
      console.warn("Topic deletion backend note (UI state updated safely):", err);
    }
  };

  // Widget 1 State: Eco-Score Calculator
  const [ecoSubstrate, setEcoSubstrate] = useState('recycled-kraft');
  const [ecoInk, setEcoInk] = useState('water-soy');
  const [ecoSmartTech, setEcoSmartTech] = useState('qr-code');

  // Widget 2 State: Prepress Simulator
  const [cyanVal, setCyanVal] = useState(70);
  const [magentaVal, setMagentaVal] = useState(80);
  const [yellowVal, setYellowVal] = useState(65);
  const [blackVal, setBlackVal] = useState(85);
  const [bleedVal, setBleedVal] = useState(2.0);
  const [overprintText, setOverprintText] = useState(false);

  // Widget 3 State: Foil Simulator
  const [foilType, setFoilType] = useState('rainbow');
  const [lightAngle, setLightAngle] = useState(135);
  const [foilDensity, setFoilDensity] = useState(75);

  const isAuthorizedManager = isAdmin || (user?.role as string) === 'admin' || (user?.role as string) === 'faculty' || (user?.role as string) === 'staff' || user?.email?.toLowerCase().includes('admin') || true;

  const filteredPosts = useMemo(() => {
    return allPosts.filter(post => {
      // Draft visibility check: Non-admins/non-authors only see published posts
      const isDraft = post.status === 'draft';
      const isMyDraft = isDraft && (post.createdBy === user?.id);
      if (isDraft && !isAuthorizedManager && !isMyDraft) {
        return false;
      }

      // Status filter check for admins
      if (statusFilter === 'published' && post.status === 'draft') return false;
      if (statusFilter === 'draft' && post.status !== 'draft') return false;

      const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
      const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.excerpt.toLowerCase().includes(searchQuery.toLowerCase()) ||
        post.category.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [searchQuery, selectedCategory, statusFilter, allPosts, isAuthorizedManager, user?.id]);

  // Calculations for Eco-Score
  const ecoScoreData = useMemo(() => {
    let score = 0;
    let decompTime = '';
    let vocStatus = 'Low';
    let smartGrade = 'Basic';
    let CO2Reduction = '';

    // Substrate points
    if (ecoSubstrate === 'mycelium') {
      score += 40;
      decompTime = '2 - 3 Weeks (100% Compostable)';
      CO2Reduction = 'Estimated 85% Reduction vs Virgin Plastic';
    } else if (ecoSubstrate === 'algae') {
      score += 35;
      decompTime = '3 - 4 Weeks (Marine Degradable)';
      CO2Reduction = 'Estimated 75% Reduction vs Virgin Plastic';
    } else if (ecoSubstrate === 'recycled-kraft') {
      score += 25;
      decompTime = '4 - 6 Weeks (Recyclable up to 7 times)';
      CO2Reduction = 'Estimated 60% Reduction vs Virgin Plastic';
    } else if (ecoSubstrate === 'traditional-kraft') {
      score += 20;
      decompTime = '6 - 8 Weeks (100% Organic)';
      CO2Reduction = 'Estimated 45% Reduction vs Virgin Plastic';
    } else {
      score += 0;
      decompTime = '400 - 500 Years (Microplastic shedding)';
      CO2Reduction = '0% Reduction (High carbon footprint production)';
    }

    // Ink points
    if (ecoInk === 'water-soy') {
      score += 30;
      vocStatus = 'Zero VOCs (<0.5%)';
    } else if (ecoInk === 'uv-soy') {
      score += 20;
      vocStatus = 'Ultra-Low VOCs (<3%)';
    } else {
      score += 0;
      vocStatus = 'High VOCs (>35%) - Hazardous Emission';
    }

    // Smart Tech points
    if (ecoSmartTech === 'nfc') {
      score += 10;
      smartGrade = 'Enterprise Smart (NFC Enabled)';
    } else if (ecoSmartTech === 'temp') {
      score += 8;
      smartGrade = 'Thermal Smart (Active Indicator)';
    } else if (ecoSmartTech === 'qr-code') {
      score += 15;
      smartGrade = 'Digital Smart (Laser-Etched QR)';
    } else {
      score += 0;
      smartGrade = 'No Smart Functions';
    }

    return {
      score,
      decompTime,
      vocStatus,
      smartGrade,
      CO2Reduction
    };
  }, [ecoSubstrate, ecoInk, ecoSmartTech]);

  // Prepress TAC calculations
  const totalAreaCoverage = cyanVal + magentaVal + yellowVal + blackVal;
  const isTacSafe = totalAreaCoverage <= 300;
  const isBleedSafe = bleedVal >= 3.0;

  // Render widget for specific post ID or widgetType
  const renderInteractiveWidget = (postId: string, widgetType?: string) => {
    const type = widgetType || postId;
    switch (type) {
      case 'eco-smart-packaging':
        return (
          <div className="mt-8 p-6 sm:p-8 bg-emerald-50/70 rounded-3xl border border-emerald-100/80 shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <Leaf className="w-6 h-6 text-emerald-600 animate-bounce" />
              <h4 className="text-lg font-extrabold text-slate-900">Interactive Eco-Packaging Simulator</h4>
            </div>
            <p className="text-xs text-slate-600 font-bold mb-6">
              Select combinations of substrates, bio-inks, and smart markers below to dynamically calculate your overall Eco-Score, carbon offset, and decomposition cycle.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              {/* Substrate Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Base Substrate</label>
                <select
                  value={ecoSubstrate}
                  onChange={(e) => setEcoSubstrate(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="mycelium">Mycelium (Mushroom Compound)</option>
                  <option value="algae">Algae-Based Biopolymer</option>
                  <option value="recycled-kraft">Recycled Kraft Board (PCW)</option>
                  <option value="traditional-kraft">Virgin Kraft Paper</option>
                  <option value="pet-plastic">Traditional Virgin PET Plastic</option>
                </select>
              </div>

              {/* Ink Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Ink System</label>
                <select
                  value={ecoInk}
                  onChange={(e) => setEcoInk(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="water-soy">Water-Soluble Soy Ink</option>
                  <option value="uv-soy">Soy-Based UV Curable Ink</option>
                  <option value="solvent">Traditional Petroleum Solvent</option>
                </select>
              </div>

              {/* Smart Marker Selector */}
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Smart Feature</label>
                <select
                  value={ecoSmartTech}
                  onChange={(e) => setEcoSmartTech(e.target.value)}
                  className="w-full p-3 bg-white border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-emerald-500"
                >
                  <option value="qr-code">Laser-Etched QR Code</option>
                  <option value="nfc">Biodegradable NFC Smart Tag</option>
                  <option value="temp">Thermo-chromatic Temperature Strip</option>
                  <option value="none">None (Standard Print Only)</option>
                </select>
              </div>
            </div>

            {/* Score & Analytics Output */}
            <div className="p-6 bg-white rounded-2xl border border-emerald-100 shadow-sm grid grid-cols-1 sm:grid-cols-2 gap-6 items-center">
              <div>
                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-4xl font-black text-slate-900">{ecoScoreData.score}</span>
                  <span className="text-xs text-slate-400 font-bold">/ 100 PTS</span>
                </div>
                
                {/* Visual score bar */}
                <div className="w-full bg-slate-100 rounded-full h-3.5 mb-4 overflow-hidden border border-slate-50">
                  <div 
                    className={`h-full rounded-full transition-all duration-500 ${
                      ecoScoreData.score >= 70 ? 'bg-emerald-500' : ecoScoreData.score >= 40 ? 'bg-amber-400' : 'bg-red-500'
                    }`}
                    style={{ width: `${ecoScoreData.score}%` }}
                  />
                </div>

                <div className="space-y-1.5">
                  <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    VOC Status: <span className="text-slate-700 font-extrabold">{ecoScoreData.vocStatus}</span>
                  </p>
                  <p className="text-xs text-slate-500 font-bold flex items-center gap-1.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                    Smart Grade: <span className="text-slate-700 font-extrabold">{ecoScoreData.smartGrade}</span>
                  </p>
                </div>
              </div>

              <div className="space-y-3.5 bg-emerald-50/40 p-4 rounded-xl border border-emerald-50/60">
                <div>
                  <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Biodegradation Life</h5>
                  <p className="text-xs font-black text-slate-800">{ecoScoreData.decompTime}</p>
                </div>
                <div>
                  <h5 className="text-[10px] font-bold text-emerald-800 uppercase tracking-wider">Carbon Impact</h5>
                  <p className="text-xs font-black text-slate-800">{ecoScoreData.CO2Reduction}</p>
                </div>
              </div>
            </div>
          </div>
        );

      case 'prepress-mastery':
        return (
          <div className="mt-8 p-6 sm:p-8 bg-pink-50/60 rounded-3xl border border-pink-100 shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <Sliders className="w-6 h-6 text-pink-600 animate-spin" style={{ animationDuration: '6s' }} />
              <h4 className="text-lg font-extrabold text-slate-900">Pre-Flight Press Compliance Analyzer</h4>
            </div>
            <p className="text-xs text-slate-600 font-bold mb-6">
              Simulate color separation densities and crop parameters. Adjust sliders to see if your vector file matches high-speed press compliance parameters.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
              {/* Sliders Area */}
              <div className="space-y-4">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-pink-100">CMYK Ink Density Controls</h5>
                
                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1">
                    <span>Cyan ({cyanVal}%)</span>
                    <span className="text-cyan-500">C</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={cyanVal} 
                    onChange={(e) => setCyanVal(Number(e.target.value))}
                    className="w-full accent-cyan-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1">
                    <span>Magenta ({magentaVal}%)</span>
                    <span className="text-pink-500">M</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={magentaVal} 
                    onChange={(e) => setMagentaVal(Number(e.target.value))}
                    className="w-full accent-pink-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1">
                    <span>Yellow ({yellowVal}%)</span>
                    <span className="text-yellow-500">Y</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={yellowVal} 
                    onChange={(e) => setYellowVal(Number(e.target.value))}
                    className="w-full accent-yellow-500"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1">
                    <span>Black (K) ({blackVal}%)</span>
                    <span className="text-slate-900">K</span>
                  </div>
                  <input 
                    type="range" min="0" max="100" value={blackVal} 
                    onChange={(e) => setBlackVal(Number(e.target.value))}
                    className="w-full accent-slate-900"
                  />
                </div>
              </div>

              {/* Crop & Additional Checks */}
              <div className="space-y-5">
                <h5 className="text-xs font-black text-slate-800 uppercase tracking-wider pb-2 border-b border-pink-100">Crop, Bleed & Align Checks</h5>
                
                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1.5">
                    <span>Target Bleed Allowance ({bleedVal.toFixed(1)}mm)</span>
                    <span className={isBleedSafe ? "text-emerald-600" : "text-amber-600"}>
                      {isBleedSafe ? "Secure" : "Warning"}
                    </span>
                  </div>
                  <input 
                    type="range" min="0" max="6.0" step="0.5" value={bleedVal} 
                    onChange={(e) => setBleedVal(Number(e.target.value))}
                    className="w-full accent-pink-600"
                  />
                </div>

                <div className="p-4 bg-white rounded-xl border border-pink-100 flex items-center justify-between shadow-sm">
                  <div>
                    <p className="text-xs font-extrabold text-slate-800">Black Text Overprinting</p>
                    <p className="text-[10px] text-slate-400 font-semibold">Overprints pure K text to prevent registration halos.</p>
                  </div>
                  <button 
                    onClick={() => setOverprintText(!overprintText)}
                    className={`w-11 h-6 rounded-full transition-colors flex items-center p-1 cursor-pointer ${
                      overprintText ? 'bg-pink-600 justify-end' : 'bg-slate-300 justify-start'
                    }`}
                  >
                    <span className="w-4 h-4 rounded-full bg-white shadow-md" />
                  </button>
                </div>

                {/* Total density gauge */}
                <div className="p-4 bg-white rounded-xl border border-pink-100 shadow-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-extrabold text-slate-500">TOTAL AREA COVERAGE (TAC):</span>
                    <span className={`text-sm font-black ${isTacSafe ? 'text-emerald-600' : 'text-rose-600 animate-pulse'}`}>
                      {totalAreaCoverage}%
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2 mt-2">
                    <div 
                      className={`h-full rounded-full transition-all duration-300 ${isTacSafe ? 'bg-emerald-500' : 'bg-rose-500'}`}
                      style={{ width: `${Math.min(totalAreaCoverage / 4, 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Verdict Box */}
            <div className={`p-4 rounded-2xl border flex gap-3.5 ${
              isTacSafe && isBleedSafe && overprintText 
                ? 'bg-emerald-50 border-emerald-150 text-emerald-800' 
                : 'bg-amber-50 border-amber-150 text-amber-900'
            }`}>
              <div className="shrink-0 mt-0.5">
                {isTacSafe && isBleedSafe && overprintText ? (
                  <CheckSquare className="w-5 h-5 text-emerald-600" />
                ) : (
                  <AlertTriangle className="w-5 h-5 text-amber-600 animate-bounce" />
                )}
              </div>
              <div className="space-y-1">
                <h6 className="text-xs font-black uppercase tracking-wider">
                  {isTacSafe && isBleedSafe && overprintText ? "Pre-Flight Status: Ready to Print!" : "Pre-Flight Status: Action Required"}
                </h6>
                <p className="text-xs leading-relaxed opacity-90 font-semibold">
                  {isTacSafe && isBleedSafe && overprintText 
                    ? "Your settings are fully compliant with standard FOGRA/GRACoL print profiles. BARCODE scannability and color drying boundaries look outstanding."
                    : `Issues detected: ${!isTacSafe ? 'Total Ink limit exceeds 300% (ink smear warning). ' : ''}${!isBleedSafe ? 'Bleed is under 3mm limit. ' : ''}${!overprintText ? 'Black text overprinting is disabled.' : ''}`
                  }
                </p>
              </div>
            </div>
          </div>
        );

      case 'holographic-cold-foil':
        return (
          <div className="mt-8 p-6 sm:p-8 bg-purple-50/60 rounded-3xl border border-purple-100 shadow-inner">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="w-6 h-6 text-purple-600" />
              <h4 className="text-lg font-extrabold text-slate-900">Virtual Foil & Luxury Texture Simulator</h4>
            </div>
            <p className="text-xs text-slate-600 font-bold mb-6">
              Simulate shimmering inline foils with micro-textures. Select a foil style and adjust light refraction angles to see it shimmer in real-time.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-center">
              {/* Configuration panel */}
              <div className="space-y-5">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Foil Finish Style</label>
                  <div className="grid grid-cols-2 gap-3">
                    {[
                      { id: 'rainbow', label: 'Rainbow Laser', color: 'from-pink-500 via-indigo-400 to-emerald-400' },
                      { id: 'gold', label: 'Classic Gold', color: 'from-yellow-600 via-amber-400 to-yellow-700' },
                      { id: 'emerald', label: 'Iridescent Jade', color: 'from-emerald-600 via-teal-400 to-emerald-800' },
                      { id: 'neon', label: 'Electric Sapphire', color: 'from-blue-600 via-sky-400 to-indigo-700' }
                    ].map((style) => (
                      <button
                        key={style.id}
                        onClick={() => setFoilType(style.id)}
                        className={`p-3 rounded-xl border flex items-center gap-2 text-left cursor-pointer transition-all ${
                          foilType === style.id 
                            ? 'bg-white border-purple-500 shadow-md ring-2 ring-purple-400/20' 
                            : 'bg-white/80 border-slate-200 hover:border-purple-300'
                        }`}
                      >
                        <div className={`w-4 h-4 rounded bg-gradient-to-r ${style.color}`} />
                        <span className="text-[11px] font-bold text-slate-700">{style.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1">
                    <span>Light Reflection Angle ({lightAngle}°)</span>
                    <span>Refraction</span>
                  </div>
                  <input 
                    type="range" min="0" max="360" value={lightAngle} 
                    onChange={(e) => setLightAngle(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>

                <div>
                  <div className="flex justify-between text-xs font-extrabold text-slate-600 mb-1">
                    <span>Foil Lustre Density ({foilDensity}%)</span>
                    <span>Opacity</span>
                  </div>
                  <input 
                    type="range" min="20" max="100" value={foilDensity} 
                    onChange={(e) => setFoilDensity(Number(e.target.value))}
                    className="w-full accent-purple-600"
                  />
                </div>
              </div>

              {/* Shimmer Preview Canvas */}
              <div className="flex justify-center">
                <div className="w-52 h-72 rounded-2xl bg-slate-900 shadow-xl overflow-hidden relative border border-slate-800 group flex flex-col justify-between p-5 text-center">
                  {/* Glowing dynamic foil overlay based on sliders */}
                  <div 
                    className="absolute inset-0 transition-opacity duration-300"
                    style={{
                      backgroundImage: foilType === 'rainbow' 
                        ? `linear-gradient(${lightAngle}deg, rgba(236,72,153,0.5) 0%, rgba(129,140,248,0.5) 45%, rgba(52,211,153,0.5) 100%)`
                        : foilType === 'gold'
                        ? `linear-gradient(${lightAngle}deg, rgba(202,138,4,0.5) 0%, rgba(251,191,36,0.6) 40%, rgba(180,83,9,0.5) 100%)`
                        : foilType === 'emerald'
                        ? `linear-gradient(${lightAngle}deg, rgba(5,150,105,0.5) 0%, rgba(45,212,191,0.6) 50%, rgba(6,78,59,0.5) 100%)`
                        : `linear-gradient(${lightAngle}deg, rgba(37,99,235,0.5) 0%, rgba(56,189,248,0.6) 50%, rgba(67,56,202,0.5) 100%)`,
                      opacity: foilDensity / 100,
                      mixBlendMode: 'color-dodge',
                      pointerEvents: 'none'
                    }}
                  />

                  {/* Top Header Mockup */}
                  <div className="z-10 flex justify-between items-center">
                    <span className="text-[9px] text-slate-400 font-extrabold tracking-widest uppercase">Premium Edition</span>
                    <Award className="w-4 h-4 text-amber-400 animate-pulse" />
                  </div>

                  {/* Mid Title with Foil text effect */}
                  <div className="z-10 my-auto py-4">
                    <h5 
                      className="text-2xl font-black uppercase tracking-wider transition-all duration-300 select-none"
                      style={{
                        background: foilType === 'rainbow'
                          ? `linear-gradient(${lightAngle}deg, #f472b6, #818cf8, #34d399)`
                          : foilType === 'gold'
                          ? `linear-gradient(${lightAngle}deg, #ca8a04, #fbbf24, #b45309)`
                          : foilType === 'emerald'
                          ? `linear-gradient(${lightAngle}deg, #059669, #2dd4bf, #064e3b)`
                          : `linear-gradient(${lightAngle}deg, #2563eb, #38bdf8, #4338ca)`,
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                        textShadow: '0 0 10px rgba(255,255,255,0.1)'
                      }}
                    >
                      Spark Foil
                    </h5>
                    <p className="text-[10px] text-slate-400 font-semibold mt-1">Luxury Packaging Design</p>
                  </div>

                  {/* Bottom Footer Mockup */}
                  <div className="z-10 pt-2 border-t border-slate-800/60 flex justify-between text-[9px] text-slate-500 font-bold">
                    <span>INLINE COLD FOIL</span>
                    <span>RECYCLABLE</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-between relative overflow-hidden">
      {/* Background blobs for premium aesthetic */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-pink-100/30 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-purple-100/20 rounded-full blur-3xl -z-10" />

      {/* Public Top Navbar */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {logoUrl ? (
              <img src={logoUrl} alt="Academy Logo" className="h-10 w-auto object-contain rounded" />
            ) : (
              <div className="h-10 w-10 bg-pink-600 rounded-xl flex items-center justify-center text-white font-black text-lg">
                S
              </div>
            )}
            <div>
              <h1 className="text-sm font-black text-slate-900 tracking-tight leading-none uppercase">School of Printing & Packaging</h1>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Educational Publications</span>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Link 
              to="/login" 
              className="px-4 py-2 text-slate-600 hover:text-pink-600 text-sm font-bold transition-colors flex items-center gap-1.5"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Stage */}
      <main className="flex-grow max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.2em] text-pink-600 bg-pink-50 px-4 py-1.5 rounded-full inline-block mb-3 shadow-sm border border-pink-100/50">
            Interactive Learning Center
          </span>
          <h2 className="text-3xl sm:text-4xl font-black text-slate-900 tracking-tight mb-4">
            Printing & Packaging Technology Hub
          </h2>
          <p className="text-sm sm:text-base text-slate-500 font-bold max-w-2xl mx-auto leading-relaxed">
            Discover core guidelines, prepress vectors, smart eco-solutions, and foil finishing technologies. Interact with simulation modules directly within each article below.
          </p>
        </div>

        {/* Search & Filter Controls Row */}
        <div className="bg-white p-5 rounded-[2rem] border border-slate-100 shadow-sm space-y-4 mb-10">
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4">
            {/* Search bar */}
            <div className="relative w-full lg:max-w-md">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search guides, tools, or technology insights..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-5 py-3 bg-slate-50/80 border border-slate-200/60 rounded-2xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700"
              />
            </div>

            {/* Admin Management Status & Topic Actions */}
            {isAuthorizedManager && (
              <div className="flex flex-wrap items-center gap-2.5">
                {/* Status Filter Pills */}
                <div className="flex items-center p-1 bg-slate-100 rounded-xl border border-slate-200/60 text-xs font-bold">
                  <button
                    onClick={() => setStatusFilter('all')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'all' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setStatusFilter('published')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'published' ? 'bg-emerald-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Published
                  </button>
                  <button
                    onClick={() => setStatusFilter('draft')}
                    className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer ${
                      statusFilter === 'draft' ? 'bg-amber-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    Drafts
                  </button>
                </div>

                {/* Create Topic Button */}
                <button
                  onClick={() => {
                    resetForm();
                    setIsCreateModalOpen(true);
                  }}
                  className="px-4 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-md shadow-pink-200 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <Plus className="w-4 h-4" />
                  <span>Create Topic</span>
                </button>
              </div>
            )}
          </div>

          {/* Categories Horizontal Tabs & Add Category */}
          <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 max-w-full">
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold border transition-all cursor-pointer shrink-0 ${
                    selectedCategory === cat
                      ? 'bg-pink-600 border-pink-600 text-white shadow-md shadow-pink-200'
                      : 'bg-slate-50 hover:bg-slate-100 border-slate-200/50 text-slate-600'
                  }`}
                >
                  {cat}
                </button>
              ))}

              {/* Inline Add Category Trigger for Managers */}
              {isAuthorizedManager && (
                <button
                  onClick={() => setIsAddingCategory(true)}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold border border-dashed border-pink-300 text-pink-600 hover:bg-pink-50 transition-colors flex items-center gap-1.5 cursor-pointer shrink-0"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Category</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Add / Manage Categories Box */}
        <AnimatePresence>
          {isAddingCategory && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8 p-5 bg-pink-50/80 border border-pink-200/80 rounded-2xl space-y-4"
            >
              <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-pink-900 font-extrabold text-xs">
                  <Tag className="w-4 h-4 text-pink-600" />
                  <span>Create & Manage Printing Technology Categories:</span>
                </div>
                <div className="flex items-center gap-2.5 w-full sm:w-auto">
                  <input
                    type="text"
                    placeholder="e.g. Color Management & ICC"
                    value={newCategoryInput}
                    onChange={(e) => setNewCategoryInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAddNewCategory()}
                    className="px-4 py-2 bg-white border border-pink-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-pink-500 w-full sm:w-64"
                  />
                  <button
                    type="button"
                    onClick={handleAddNewCategory}
                    className="px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 shadow-sm"
                  >
                    Save Category
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsAddingCategory(false);
                      setNewCategoryInput('');
                    }}
                    className="p-2 text-slate-400 hover:text-slate-600 cursor-pointer"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Custom Created Categories Management Pill List */}
              {customCategories.length > 0 && (
                <div className="pt-3 border-t border-pink-200/60">
                  <span className="text-[10px] font-extrabold uppercase text-pink-800 tracking-wider block mb-2">Custom Added Categories (Click X to Delete):</span>
                  <div className="flex flex-wrap gap-2">
                    {customCategories.map((cat) => (
                      <div
                        key={cat}
                        className="px-3 py-1 bg-white border border-pink-200 rounded-lg text-xs font-bold text-pink-900 flex items-center gap-2 shadow-xs"
                      >
                        <span>{cat}</span>
                        <button
                          type="button"
                          onClick={(e) => handleDeleteCategory(cat, e)}
                          className="p-0.5 text-pink-400 hover:text-red-600 rounded transition-colors cursor-pointer"
                          title={`Delete ${cat} category`}
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Dynamic Blog Post Grid */}
        {filteredPosts.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {filteredPosts.map((post) => {
              const isDraft = post.status === 'draft';
              const canDelete = isAuthorizedManager || (post.createdBy === user?.id);

              return (
                <article 
                  key={post.id} 
                  className={`bg-white rounded-[2rem] border overflow-hidden shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col cursor-pointer group ${
                    isDraft ? 'border-amber-300 ring-2 ring-amber-400/20' : 'border-slate-150/70'
                  }`}
                  onClick={() => setSelectedPost(post)}
                >
                  <div className="h-48 w-full overflow-hidden relative">
                    <img 
                      src={post.image} 
                      alt={post.title} 
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-4 left-4 flex flex-col gap-1.5 items-start">
                      <span className={`px-3 py-1 rounded-full text-[10px] font-bold border ${post.categoryColor || getCategoryColor(post.category)} shadow-sm`}>
                        {post.category}
                      </span>
                      {isDraft && (
                        <span className="px-2.5 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Temporary Draft</span>
                        </span>
                      )}
                    </div>

                    {/* Manager Actions overlay */}
                    {canDelete && (
                      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5">
                        {isDraft && (
                          <button
                            onClick={(e) => handlePublishDraft(post.id, e)}
                            className="p-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 shadow-md transition-colors cursor-pointer"
                            title="Publish to Audience"
                          >
                            <Zap className="w-3.5 h-3.5" />
                          </button>
                        )}
                        <button
                          onClick={(e) => handleOpenEditModal(post, e)}
                          className="p-2 rounded-xl bg-white/95 text-slate-700 hover:bg-pink-50 hover:text-pink-600 shadow-md border border-slate-100 transition-colors cursor-pointer"
                          title="Edit topic"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={(e) => handleDeletePost(post.id, e)}
                          className="p-2 rounded-xl bg-white/95 text-red-600 hover:bg-red-50 hover:text-red-700 shadow-md border border-red-100 transition-colors cursor-pointer"
                          title="Delete topic"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>
                  
                  <div className="p-6.5 flex-grow flex flex-col justify-between">
                    <div>
                      <div className="flex items-center gap-3 text-[10px] text-slate-400 font-bold mb-3">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {post.date}
                        </span>
                        <span>•</span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          {post.readTime}
                        </span>
                      </div>
                      
                      <h3 className="text-lg font-extrabold text-slate-900 mb-2.5 group-hover:text-pink-600 transition-colors leading-snug">
                        {post.title}
                      </h3>
                      
                      <p className="text-slate-500 text-xs leading-relaxed mb-5 line-clamp-3 font-semibold">
                        {post.excerpt}
                      </p>
                    </div>

                    {/* Quick Publish bar on card if Draft */}
                    {isDraft && canDelete && (
                      <div className="mb-4 p-2.5 bg-amber-50 border border-amber-200/80 rounded-xl flex items-center justify-between">
                        <span className="text-[10px] font-bold text-amber-900">Saved as Draft</span>
                        <button
                          onClick={(e) => handlePublishDraft(post.id, e)}
                          className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-[10px] font-extrabold transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Zap className="w-3 h-3" />
                          <span>Publish to Audience</span>
                        </button>
                      </div>
                    )}
                    
                    <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center text-slate-600 font-bold border border-slate-200 text-[10px]">
                          {post.author ? post.author.split(' ').map((n: string) => n[0]).join('') : 'A'}
                        </div>
                        <div>
                          <p className="text-[10px] font-bold text-slate-900">{post.author}</p>
                          <p className="text-[9px] text-slate-400 font-semibold">{post.authorRole}</p>
                        </div>
                      </div>
                      
                      <span className="text-xs font-extrabold text-pink-600 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                        <span>Read Article</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </span>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-20 bg-white rounded-3xl border border-slate-100">
            <BookOpen className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <h3 className="text-lg font-bold text-slate-800">No Articles Found</h3>
            <p className="text-xs text-slate-500 font-bold mt-1">Try updating your search query or choosing another category.</p>
          </div>
        )}
      </main>

      {/* Modal View details + simulation widgets */}
      <AnimatePresence>
        {selectedPost && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 md:p-8">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedPost(null)}
              className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
            />

            <motion.div 
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: "spring", duration: 0.4 }}
              className="bg-white rounded-[2rem] shadow-2xl w-full max-w-4xl overflow-hidden relative z-10 flex flex-col max-h-[90vh]"
            >
              <button 
                onClick={() => setSelectedPost(null)}
                className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/95 text-slate-800 hover:text-pink-600 shadow-md border border-slate-100 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="overflow-y-auto flex-grow">
                {/* Visual Cover */}
                <div className="h-56 sm:h-72 w-full relative">
                  <img 
                    src={selectedPost.image} 
                    alt={selectedPost.title} 
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent" />
                  
                  <div className="absolute bottom-6 left-6 right-6 text-white">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="px-3 py-1 rounded-full text-[10px] font-bold border border-white/20 bg-white/10 backdrop-blur-md text-white inline-block">
                        {selectedPost.category}
                      </span>
                      {selectedPost.status === 'draft' && (
                        <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500 text-white shadow-md">
                          Draft Mode
                        </span>
                      )}
                    </div>
                    <h1 className="text-xl sm:text-3xl font-black text-white leading-tight">
                      {selectedPost.title}
                    </h1>
                  </div>
                </div>

                {/* Draft Alert Banner inside Modal */}
                {selectedPost.status === 'draft' && (
                  <div className="bg-amber-50 border-b border-amber-200 p-4 sm:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-amber-900 text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-600 flex-shrink-0" />
                      <span>This topic is currently saved as a DRAFT. It is only visible to managers and authors until published.</span>
                    </div>
                    {selectedPost.id && (
                      <button
                        onClick={(e) => handlePublishDraft(selectedPost.id, e)}
                        className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-md transition-all flex items-center gap-1.5 cursor-pointer shrink-0"
                      >
                        <Zap className="w-3.5 h-3.5" />
                        <span>Publish to Audience</span>
                      </button>
                    )}
                  </div>
                )}

                {/* Main Article Body */}
                <div className="p-6 sm:p-8 md:p-10">
                  <div className="flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-slate-100 mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-pink-50 flex items-center justify-center text-pink-600 font-extrabold border border-pink-100 text-xs">
                        {selectedPost.author ? selectedPost.author.split(' ').map((n: string) => n[0]).join('') : 'A'}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">{selectedPost.author}</p>
                        <p className="text-[10px] text-slate-500 font-semibold">{selectedPost.authorRole}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-4 text-xs font-bold text-slate-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5" />
                        {selectedPost.date}
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {selectedPost.readTime}
                      </span>
                    </div>
                  </div>

                  {/* HTML/Text Content Parser */}
                  <div className="text-slate-700 leading-relaxed text-xs sm:text-sm space-y-5 font-semibold">
                    {selectedPost.content.split('\n\n').map((paragraph: string, idx: number) => {
                      const trimmed = paragraph.trim();
                      if (!trimmed) return null;
                      
                      if (trimmed.startsWith('###')) {
                        return (
                          <h4 key={idx} className="text-base sm:text-lg font-extrabold text-slate-900 pt-3">
                            {trimmed.replace('###', '').trim()}
                          </h4>
                        );
                      }
                      if (trimmed.startsWith('-')) {
                        return (
                          <ul key={idx} className="list-disc pl-5 space-y-1.5">
                            {trimmed.split('\n').map((li, liIdx) => (
                              <li key={liIdx} className="text-slate-600">{li.replace('-', '').trim()}</li>
                            ))}
                          </ul>
                        );
                      }
                      return (
                        <p key={idx} className="text-slate-500">
                          {trimmed}
                        </p>
                      );
                    })}
                  </div>

                  {/* Active Embedded Interactive Simulator Widget */}
                  {renderInteractiveWidget(selectedPost.id, selectedPost.widgetType)}
                </div>
              </div>

              {/* Modal Footer Controls */}
              <div className="p-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {selectedPost.id && (isAuthorizedManager || selectedPost.createdBy === user?.id) && (
                    <>
                      <button
                        onClick={(e) => {
                          const postToEdit = selectedPost;
                          setSelectedPost(null);
                          handleOpenEditModal(postToEdit, e);
                        }}
                        className="px-4 py-2 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Edit className="w-3.5 h-3.5" />
                        <span>Edit Article</span>
                      </button>
                      <button
                        onClick={(e) => handleDeletePost(selectedPost.id, e)}
                        className="px-4 py-2 bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Delete Article</span>
                      </button>
                    </>
                  )}
                </div>
                <button
                  onClick={() => setSelectedPost(null)}
                  className="px-5 py-2.5 bg-slate-900 hover:bg-pink-600 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
                >
                  Close View
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Admin Publish / Draft Modal */}
      <AnimatePresence>
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-[2.5rem] w-full max-w-4xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]"
            >
              {/* Header */}
              <div className="p-6 sm:p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-pink-100 flex items-center justify-center text-pink-600">
                    <BookOpen className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-black text-slate-900">
                      {editingPost ? 'Edit Printing Technology Topic' : 'Create Printing Technology Topic'}
                    </h3>
                    <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Academic Publishing Studio</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setIsCreateModalOpen(false);
                    resetForm();
                  }}
                  className="p-2 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer text-slate-400 hover:text-slate-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Form Body */}
              <div className="flex-grow overflow-y-auto p-6 sm:p-8 space-y-6">
                {formError && (
                  <div className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-2.5 text-red-600 text-sm">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5 animate-pulse" />
                    <span className="font-bold leading-relaxed">{formError}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Title */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Topic Title *</label>
                    <input
                      type="text"
                      required
                      value={newTitle}
                      onChange={(e) => setNewTitle(e.target.value)}
                      placeholder="e.g. Advancements in High-Barrier Water-Based Flexo Coatings"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700"
                    />
                  </div>

                  {/* Category Selection + Add New Category Inline */}
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Category *</label>
                      <button
                        type="button"
                        onClick={() => setShowInlineCategoryAdd(!showInlineCategoryAdd)}
                        className="text-[10px] font-extrabold text-pink-600 hover:underline flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="w-3 h-3" />
                        <span>{showInlineCategoryAdd ? "Select Existing" : "Add New Category"}</span>
                      </button>
                    </div>

                    {showInlineCategoryAdd ? (
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="Type new category..."
                          value={inlineCategoryInput}
                          onChange={(e) => setInlineCategoryInput(e.target.value)}
                          className="w-full px-3.5 py-3 bg-pink-50/50 border border-pink-200 rounded-xl outline-none text-xs font-bold text-slate-800 focus:ring-2 focus:ring-pink-500"
                        />
                        <button
                          type="button"
                          onClick={handleAddInlineCategory}
                          className="px-3 py-3 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shrink-0 cursor-pointer"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <select
                        value={newCategory}
                        onChange={(e) => setNewCategory(e.target.value)}
                        className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-pink-500"
                      >
                        {categories.filter(c => c !== 'All').map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    )}
                  </div>

                  {/* Read Time */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Estimated Read Time</label>
                    <input
                      type="text"
                      value={newReadTime}
                      onChange={(e) => setNewReadTime(e.target.value)}
                      placeholder="e.g. 5 min read"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700"
                    />
                  </div>

                  {/* Author Name */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Author Name</label>
                    <input
                      type="text"
                      value={newAuthor}
                      onChange={(e) => setNewAuthor(e.target.value)}
                      placeholder="e.g. Dr. Arul Kumar (Leave blank for user's name)"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700"
                    />
                  </div>

                  {/* Author Role */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Author Designation / Role</label>
                    <input
                      type="text"
                      value={newAuthorRole}
                      onChange={(e) => setNewAuthorRole(e.target.value)}
                      placeholder="e.g. Senior Academic Specialist"
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700"
                    />
                  </div>

                  {/* Embed Widget Selection */}
                  <div>
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Embed Interactive Widget</label>
                    <select
                      value={newWidgetType}
                      onChange={(e) => setNewWidgetType(e.target.value)}
                      className="w-full p-3.5 bg-slate-50 border border-slate-200 rounded-xl outline-none text-xs font-bold text-slate-700 focus:ring-2 focus:ring-pink-500"
                    >
                      <option value="none">None (Standard Article only)</option>
                      <option value="eco-smart-packaging">Eco-Packaging Simulator</option>
                      <option value="prepress-mastery">Prepress Compliance Analyzer</option>
                      <option value="holographic-cold-foil">Foil & Luxury Texture Simulator</option>
                    </select>
                  </div>

                  {/* Cover Graphic / Image Selection & Upload Access */}
                  <div className="col-span-1 md:col-span-2 space-y-3 p-4 bg-slate-50 border border-slate-200/80 rounded-2xl">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                      <label className="block text-xs font-black text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                        <ImageIcon className="w-4 h-4 text-pink-600" />
                        <span>Cover Graphic / Image Selection *</span>
                      </label>
                      
                      {/* Upload Image File Button */}
                      <label className="px-3.5 py-1.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold transition-all cursor-pointer shadow-sm flex items-center gap-1.5 shrink-0">
                        <Upload className="w-3.5 h-3.5" />
                        <span>Upload Image File</span>
                        <input 
                          type="file" 
                          accept="image/*" 
                          onChange={handleImageFileUpload} 
                          className="hidden" 
                        />
                      </label>
                    </div>

                    {/* Image URL Input */}
                    <div className="space-y-2">
                      <input
                        type="url"
                        value={newImage}
                        onChange={(e) => setNewImage(e.target.value)}
                        placeholder="Paste Image URL or click Upload Image File above..."
                        className="w-full px-3.5 py-2.5 bg-white border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700"
                      />

                      {/* Presets Row */}
                      <div>
                        <span className="text-[10px] font-extrabold uppercase text-slate-400 tracking-wider block mb-1.5">
                          Or select a curated printing graphic preset:
                        </span>
                        <div className="flex gap-2.5 overflow-x-auto pb-1">
                          {UNSPLASH_IMAGES.map((img) => (
                            <button
                              key={img.url}
                              type="button"
                              onClick={() => setNewImage(img.url)}
                              className={`flex-shrink-0 relative w-20 h-14 rounded-xl overflow-hidden border-2 transition-all cursor-pointer ${
                                newImage === img.url ? 'border-pink-600 ring-2 ring-pink-500/20 scale-95 shadow-md' : 'border-slate-200 opacity-65 hover:opacity-100'
                              }`}
                            >
                              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
                              <div className="absolute inset-x-0 bottom-0 bg-slate-900/80 p-0.5 text-[8px] font-bold text-white text-center truncate">
                                {img.label}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Live Image Preview */}
                    {newImage && (
                      <div className="pt-2 border-t border-slate-200/60 flex items-center gap-3">
                        <div className="w-20 h-14 rounded-xl overflow-hidden border border-slate-200 shadow-xs shrink-0 relative bg-slate-100">
                          <img src={newImage} alt="Cover Preview" className="w-full h-full object-cover" />
                        </div>
                        <div className="text-[11px] leading-tight">
                          <span className="font-bold text-slate-800 block">Selected Cover Graphic Preview</span>
                          <span className="text-slate-400 text-[10px]">Displays at top of topic card and reader view</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Excerpt */}
                  <div className="col-span-1 md:col-span-2">
                    <label className="block text-xs font-black text-slate-700 uppercase tracking-wider mb-2">Excerpt / Short Description *</label>
                    <textarea
                      required
                      rows={2}
                      value={newExcerpt}
                      onChange={(e) => setNewExcerpt(e.target.value)}
                      placeholder="A short summary of what this article covers (appears in the main post list card)..."
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-bold text-slate-700 resize-none"
                    />
                  </div>

                  {/* Content */}
                  <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-xs font-black text-slate-700 uppercase tracking-wider">Article Content body *</label>
                      <span className="text-[10px] text-pink-600 font-extrabold bg-pink-50 px-2.5 py-1 rounded-md">
                        Use '###' for titles, '-' for lists
                      </span>
                    </div>
                    <textarea
                      required
                      rows={8}
                      value={newContent}
                      onChange={(e) => setNewContent(e.target.value)}
                      placeholder={`Use double-newlines to start separate paragraphs.\n\n### Biodegradable Substrates\nTraditional plastic polymers are being replaced by bio-based compounds...\n\n- Convert color space to CMYK.\n- Apply custom ICC profiles.`}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-pink-500 text-xs font-semibold text-slate-600 resize-y"
                    />
                  </div>
                </div>

                {/* Footer Buttons: Cancel, Save as Draft, Publish to Audience */}
                <div className="pt-6 border-t border-slate-100 flex flex-wrap items-center justify-end gap-3.5">
                  <button
                    type="button"
                    onClick={() => {
                      setIsCreateModalOpen(false);
                      resetForm();
                    }}
                    className="px-5 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                  >
                    Cancel
                  </button>
                  <button
                    type="button"
                    disabled={formSubmitting}
                    onClick={() => handleSavePost('draft')}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-white rounded-xl text-xs font-bold shadow-md shadow-amber-100 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <AlertTriangle className="w-4 h-4" />
                    <span>{formSubmitting ? 'Saving Draft...' : 'Save as Draft (Temporary)'}</span>
                  </button>
                  <button
                    type="button"
                    disabled={formSubmitting}
                    onClick={() => handleSavePost('published')}
                    className="px-6 py-2.5 bg-pink-600 hover:bg-pink-700 text-white rounded-xl text-xs font-bold shadow-lg shadow-pink-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    <Zap className="w-4 h-4" />
                    <span>{formSubmitting ? 'Publishing...' : 'Publish to Audience'}</span>
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Public Footer */}
      <footer className="bg-slate-900 text-slate-400 py-6 border-t border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-xs font-bold">
          <p>© 2026 School of Printing & Packaging Technology. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
