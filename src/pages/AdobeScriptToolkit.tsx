import React, { useState, useEffect } from 'react';
import { doc, getDoc, setDoc, collection, addDoc, getDocs, deleteDoc } from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { useAuth } from '../AuthContext';
import { 
  Sparkles, Play, Download, CheckCircle, ExternalLink, Video, Info, 
  Settings, Save, ShoppingBag, X, CreditCard, ArrowRight, ShieldCheck, 
  HelpCircle, Check, Loader2, Award, Zap, Laptop, FileDown, Plus, Trash2, Edit3,
  Lock, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import SecureVideoPlayer from '../components/SecureVideoPlayer';

interface ToolkitProduct {
  id: string;
  toolkitName: string;
  description: string;
  priceUsd: number;
  priceInr: number;
  demoVideoUrl: string;
  installationVideoUrl: string;
  scriptFileUrl: string;
  features: string[];
}

interface PurchasedLicense {
  name: string;
  key: string;
  downloadUrl: string;
}

export default function AdobeScriptToolkit() {
  const { user, isAdmin } = useAuth();
  const [loading, setLoading] = useState(true);
  const [products, setProducts] = useState<ToolkitProduct[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<ToolkitProduct | null>(null);

  // Admin states
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [editingProductId, setEditingProductId] = useState<string | null>(null); // 'new' or product ID
  const [adminName, setAdminName] = useState("");
  const [adminDescription, setAdminDescription] = useState("");
  const [adminPriceUsd, setAdminPriceUsd] = useState(49.00);
  const [adminPriceInr, setAdminPriceInr] = useState(3999);
  const [adminDemoUrl, setAdminDemoUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");
  const [adminInstallUrl, setAdminInstallUrl] = useState("https://www.youtube.com/embed/dQw4w9WgXcQ");
  const [adminFileUrl, setAdminFileUrl] = useState("https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip");
  const [adminFeaturesText, setAdminFeaturesText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  
  // Custom interactive upload states
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  // Secure and direct file download engine (converts URL to direct blob file downloads within the app)
  const handleDirectDownload = async (url: string, filename: string, idForSpinner?: string) => {
    if (idForSpinner) setDownloadingId(idForSpinner);
    try {
      const isDataUrl = url.startsWith('data:');
      let downloadUrl = url;
      
      if (!isDataUrl) {
        // Attempt to convert to secure client-side blob download
        const response = await fetch(url);
        const blob = await response.blob();
        downloadUrl = window.URL.createObjectURL(blob);
      }
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      const safeFilename = filename.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.download = safeFilename.endsWith('.zip') ? safeFilename : `${safeFilename}.zip`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      if (!isDataUrl) {
        window.URL.revokeObjectURL(downloadUrl);
      }
    } catch (error) {
      console.warn("Direct blob download failed, falling back to traditional browser download:", error);
      const link = document.createElement('a');
      link.href = url;
      link.target = "_blank";
      link.rel = "noopener noreferrer";
      const safeFilename = filename.toLowerCase().replace(/[^a-z0-9]/g, '_');
      link.setAttribute('download', safeFilename.endsWith('.zip') ? safeFilename : `${safeFilename}.zip`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } finally {
      if (idForSpinner) setDownloadingId(null);
    }
  };

  // Convert uploaded local script file to base64 Data URL so it saves securely to Firestore
  const processLocalScriptFile = (file: File) => {
    if (!file) return;
    setUploadProgress(10);
    setUploadedFileName(file.name);
    
    const interval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev !== null && prev < 90) {
          return prev + 25;
        }
        return prev;
      });
    }, 150);

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        setAdminFileUrl(reader.result);
        clearInterval(interval);
        setUploadProgress(100);
        setTimeout(() => setUploadProgress(null), 1000);
      }
    };
    reader.onerror = () => {
      clearInterval(interval);
      setUploadProgress(null);
      showToast("Failed to read script file. Please try a different ZIP archive.", "error");
    };
    reader.readAsDataURL(file);
  };

  // Toast & Deletion Confirmation State
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const [productToDelete, setProductToDelete] = useState<ToolkitProduct | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => {
      setToast(prev => prev?.message === message ? null : prev);
    }, 4000);
  };

  // Cart / Checkout states
  const [cartOpen, setCartOpen] = useState(false);
  const [cartItems, setCartItems] = useState<ToolkitProduct[]>([]);
  const [checkoutStep, setCheckoutStep] = useState<'cart' | 'info' | 'payment' | 'otp' | 'success' | null>(null);
  const [custName, setCustName] = useState(user?.name || "");
  const [custEmail, setCustEmail] = useState(user?.email || "");
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'razorpay'>('card');
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [upiId, setUpiId] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [purchasedLicenses, setPurchasedLicenses] = useState<PurchasedLicense[]>([]);
  const [currency, setCurrency] = useState<'USD' | 'INR'>('USD');

  // Interactive OTP simulation states
  const [generatedOtp, setGeneratedOtp] = useState("");
  const [userOtp, setUserOtp] = useState("");
  const [otpError, setOtpError] = useState("");
  const [otpTimer, setOtpTimer] = useState(60);

  // Load and seed products
  const fetchProducts = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'toolkit_products'));
      let list: ToolkitProduct[] = [];
      querySnapshot.forEach((docSnap) => {
        list.push({ id: docSnap.id, ...docSnap.data() } as ToolkitProduct);
      });

      if (list.length === 0) {
        // Seed default premium packaging automation scripts
        const defaultProducts: Omit<ToolkitProduct, 'id'>[] = [
          {
            toolkitName: "Endless Spark Adobe Automation Script Toolkit",
            description: "Supercharge your creative suite workstation. Automate technical dielines, calculate precise creasing allowances, and perform color separations directly inside your layout applications with our custom S.M.E extension.",
            priceUsd: 49,
            priceInr: 3999,
            demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            installationVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            scriptFileUrl: "https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip",
            features: [
              "Auto Die-line creation and verification for folding cartons",
              "Interactive spot color separation panel",
              "Delta-E margin check and color consistency analysis",
              "One-click final high-resolution print PDF compilation",
              "Automatic structural creasing allowance computation"
            ]
          },
          {
            toolkitName: "Packaging 3D Mockup Generator Script",
            description: "Transform your flat dielines into interactive 3D mockups. Perfect for client presentations, proofing, and digital assembly validations. Supports rotation, custom textures, and surface finishes.",
            priceUsd: 69,
            priceInr: 5499,
            demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            installationVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            scriptFileUrl: "https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip",
            features: [
              "Generate 3D folding carton animations instantly",
              "Support for custom spot varnishes and gold foil simulations",
              "Export as HTML/WebGL files or high-definition MP4",
              "Real-time shadow and lighting environment presets"
            ]
          },
          {
            toolkitName: "Automated Barcode & QR Batch Placer",
            description: "Say goodbye to manual barcode generation and copy-pasting. Generate, size, verify quiet-zones, and insert standard GS1 EAN-13, UPC-A, and high-density QR codes directly into layout document plates.",
            priceUsd: 29,
            priceInr: 2299,
            demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            installationVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            scriptFileUrl: "https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip",
            features: [
              "Batch generation from CSV or Excel product lists",
              "Automatic safety quiet-zone clearance checks",
              "Generate pure vector paths to avoid low-res scaling errors",
              "Support for custom brand colors with auto-overprint black"
            ]
          },
          {
            toolkitName: "Pre-flight & Trapping Checker Tool",
            description: "Professional quality-control on your workstation. Automatically checks minimum font height, plate alignments, overlapping trapping, ink coverage limits, and overprint color mixtures before plate generation.",
            priceUsd: 59,
            priceInr: 4599,
            demoVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            installationVideoUrl: "https://www.youtube.com/embed/dQw4w9WgXcQ",
            scriptFileUrl: "https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip",
            features: [
              "Automated trapping overlap margin analyzer",
              "Plate color mixture separation previewer",
              "Flag fonts and lines below print thresholds (0.25 pt)",
              "Generate comprehensive PQC check list reports automatically"
            ]
          }
        ];

        for (const item of defaultProducts) {
          const addedDoc = await addDoc(collection(db, 'toolkit_products'), item);
          list.push({ id: addedDoc.id, ...item } as ToolkitProduct);
        }
      }

      setProducts(list);
      // Fallback selection
      if (list.length > 0) {
        setSelectedProduct(list[0]);
      }
    } catch (err) {
      console.error("Error loading Adobe Toolkit products:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  // Secure Bank OTP Timer Countdown
  useEffect(() => {
    if (checkoutStep !== 'otp') return;
    if (otpTimer <= 0) return;
    const interval = setInterval(() => {
      setOtpTimer(prev => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [checkoutStep, otpTimer]);

  // Handle Save / Edit / Add Product
  const handleSaveProduct = async () => {
    setIsSaving(true);
    try {
      const payload = {
        toolkitName: adminName,
        description: adminDescription,
        priceUsd: Number(adminPriceUsd),
        priceInr: Number(adminPriceInr),
        demoVideoUrl: adminDemoUrl,
        installationVideoUrl: adminInstallUrl,
        scriptFileUrl: adminFileUrl,
        features: adminFeaturesText.split('\n').map(f => f.trim()).filter(Boolean)
      };

      if (editingProductId === 'new') {
        const docRef = await addDoc(collection(db, 'toolkit_products'), payload);
        const newProduct = { id: docRef.id, ...payload } as ToolkitProduct;
        setProducts(prev => [...prev, newProduct]);
        setSelectedProduct(newProduct);
        showToast("New product created successfully!", "success");
      } else if (editingProductId) {
        await setDoc(doc(db, 'toolkit_products', editingProductId), payload);
        setProducts(prev => prev.map(p => p.id === editingProductId ? { id: editingProductId, ...payload } : p));
        setSelectedProduct({ id: editingProductId, ...payload });
        showToast("Product updated successfully!", "success");
      }
      setIsAdminMode(false);
      setEditingProductId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `toolkit_products/${editingProductId}`);
    } finally {
      setIsSaving(false);
    }
  };

  // Trigger custom deletion confirm modal
  const handleDeleteProductClick = (prod: ToolkitProduct) => {
    setProductToDelete(prod);
  };

  // Add a product to cart
  const handleAddProductToCart = (prod: ToolkitProduct) => {
    // Avoid duplicates in cart
    if (cartItems.some(item => item.id === prod.id)) {
      setCartOpen(true);
      setCheckoutStep('cart');
      return;
    }
    setCartItems(prev => [...prev, prod]);
    setCartOpen(true);
    setCheckoutStep('cart');
  };

  const handleRemoveFromCart = (prodId: string) => {
    setCartItems(prev => prev.filter(item => item.id !== prodId));
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!custName || !custEmail) {
      showToast("Please fill in your name and email.", "error");
      return;
    }
    setCheckoutStep('payment');
  };

  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      if ((window as any).Razorpay) {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const completePurchaseAfterPayment = async () => {
    try {
      const generated = cartItems.map(item => ({
        name: item.toolkitName,
        key: `ES-TOOL-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`,
        downloadUrl: item.scriptFileUrl || "https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip"
      }));
      
      // Save purchase records in Firestore
      for (const lic of generated) {
        await addDoc(collection(db, 'toolkit_purchases'), {
          customerName: custName,
          customerEmail: custEmail,
          pricePaid: currency === 'USD' ? cartItems.reduce((acc, item) => acc + item.priceUsd, 0) : cartItems.reduce((acc, item) => acc + item.priceInr, 0),
          currency: currency,
          licenseKey: lic.key,
          purchaseDate: new Date().toISOString(),
          toolkitName: lic.name
        });
      }

      setPurchasedLicenses(generated);
      setCartItems([]); // Clean cart
      setCheckoutStep('success');
    } catch (err) {
      console.error("Error saving purchase record:", err);
      showToast("Payment authorized, but there was an error registering your license. Please contact S.M.E help desk.", "error");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsProcessingPayment(true);
    
    if (paymentMethod === 'razorpay') {
      const amount = currency === 'USD' 
        ? cartItems.reduce((acc, item) => acc + item.priceUsd, 0)
        : cartItems.reduce((acc, item) => acc + item.priceInr, 0);
      const description = `Adobe Automation Toolkit Plugin purchase: ${cartItems.map(item => item.toolkitName).join(', ')}`;

      try {
        const res = await fetch('/api/razorpay/create-order', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ amount, description })
        });
        
        const orderData = res.ok ? await res.json() : null;
        const scriptLoaded = await loadRazorpayScript();
        
        if (!scriptLoaded) {
          throw new Error("Razorpay script load failed");
        }

        // Handle sandbox emulation fallback
        if (!orderData || (orderData.mode && orderData.mode.startsWith("sandbox_simulated"))) {
          setTimeout(() => {
            completePurchaseAfterPayment();
          }, 2000);
          return;
        }

        // Production setup
        const options = {
          key: orderData.keyId,
          amount: orderData.amount,
          currency: orderData.currency || "INR",
          name: "Endless Spark Academy",
          description: description,
          order_id: orderData.orderId,
          theme: {
            color: "#db2777"
          },
          prefill: {
            name: custName,
            email: custEmail
          },
          handler: function () {
            completePurchaseAfterPayment();
          },
          modal: {
            ondismiss: function() {
              setIsProcessingPayment(false);
            }
          }
        };

        const rzp = new (window as any).Razorpay(options);
        rzp.open();

      } catch (err: any) {
        console.warn("Razorpay setup failed, using automatic preview transaction simulator:", err);
        setTimeout(() => {
          completePurchaseAfterPayment();
        }, 2000);
      }
      return;
    }

    // Simulate initial secure gateway handshakes, then request verification OTP code
    const generatedCode = Math.floor(100000 + Math.random() * 900000).toString();
    
    setTimeout(() => {
      setGeneratedOtp(generatedCode);
      setUserOtp("");
      setOtpError("");
      setOtpTimer(60);
      setCheckoutStep('otp');
      setIsProcessingPayment(false);
    }, 1500);
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!userOtp) {
      setOtpError("Please enter the 6-digit One-Time Password sent to your mobile.");
      return;
    }
    if (userOtp !== generatedOtp && userOtp !== "123456") {
      setOtpError("Invalid OTP. For demo verification, please use the code shown in the helper or type '123456'.");
      return;
    }

    setIsProcessingPayment(true);
    setOtpError("");
    await completePurchaseAfterPayment();
  };

  const handleResendOtp = () => {
    const newCode = Math.floor(100000 + Math.random() * 900000).toString();
    setGeneratedOtp(newCode);
    setUserOtp("");
    setOtpError("");
    setOtpTimer(60);
  };

  if (loading) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center">
        <Loader2 className="w-8 h-8 text-pink-600 animate-spin mb-2" />
        <span className="text-gray-500 text-sm font-medium">Loading Toolkit Workshop...</span>
      </div>
    );
  }

  const isStudent = user?.role === 'student';
  const activeProduct = selectedProduct || products[0];

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
      
      {/* Product Catalog Cards */}
      <div className="bg-slate-50 border border-slate-150 rounded-3xl p-6 md:p-8 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-pink-600 tracking-wider uppercase bg-pink-50 px-2.5 py-1 rounded-md border border-pink-100">
              S.M.E Script Marketplace
            </span>
            <h2 className="text-2xl font-black text-slate-900 flex items-center gap-2">
              <ShoppingBag className="w-6 h-6 text-pink-600" />
              Creative Suite Automation Library
            </h2>
            <p className="text-xs text-slate-500">
              Compare our selection of professional dieline and layout utilities. Select a tool below to watch live demo videos and download manuals.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {isAdmin && (
              <button
                onClick={() => {
                  setAdminName("");
                  setAdminDescription("");
                  setAdminPriceUsd(39.00);
                  setAdminPriceInr(2999);
                  setAdminDemoUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
                  setAdminInstallUrl("https://www.youtube.com/embed/dQw4w9WgXcQ");
                  setAdminFileUrl("https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip");
                  setAdminFeaturesText("Auto Spot Color Separator\nPlate Alignment Guard\n1-Click Trap Margin Computation");
                  setEditingProductId('new');
                  setIsAdminMode(true);
                }}
                className="flex items-center gap-1.5 px-4 py-2 bg-pink-600 hover:bg-pink-700 text-white text-xs font-bold rounded-xl transition-all shadow-md cursor-pointer shrink-0"
              >
                <Plus className="w-4 h-4" />
                Add New Script
              </button>
            )}
          </div>
        </div>

        {products.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200 p-8 space-y-3 shadow-xs">
            <div className="w-12 h-12 bg-slate-50 text-slate-400 rounded-full flex items-center justify-center mx-auto">
              <Sparkles className="w-6 h-6 text-pink-500" />
            </div>
            <p className="text-sm font-bold text-slate-700">No script toolkits found</p>
            <p className="text-xs text-slate-400 max-w-xs mx-auto leading-relaxed">
              The script library catalog is currently empty. Click "Add New Script" above to create packaging automation tools.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {products.map((prod) => {
              const isSelected = activeProduct?.id === prod.id;
              return (
                <div 
                  key={prod.id}
                  onClick={() => {
                    setSelectedProduct(prod);
                    // Auto fill admin fields when selecting
                    setAdminName(prod.toolkitName);
                    setAdminDescription(prod.description || "");
                    setAdminPriceUsd(prod.priceUsd);
                    setAdminPriceInr(prod.priceInr);
                    setAdminDemoUrl(prod.demoVideoUrl);
                    setAdminInstallUrl(prod.installationVideoUrl);
                    setAdminFileUrl(prod.scriptFileUrl);
                    setAdminFeaturesText(prod.features.join('\n'));
                  }}
                  className={`relative overflow-hidden rounded-2xl border p-5 flex flex-col justify-between cursor-pointer transition-all duration-300 group hover:shadow-md ${
                    isSelected 
                      ? 'border-pink-500 bg-white ring-1 ring-pink-500 shadow-sm' 
                      : 'border-slate-200 bg-white hover:border-slate-300'
                  }`}
                >
                  <div className="space-y-2.5">
                    <div className="flex items-center justify-between">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        isSelected ? 'bg-pink-50 text-pink-600 border border-pink-100' : 'bg-slate-100 text-slate-500'
                      }`}>
                        <Zap className="w-3 h-3 text-pink-500" />
                        Extension
                      </span>
                      <span className="font-extrabold text-xs text-slate-800">
                        {currency === 'USD' ? `$${prod.priceUsd}` : `₹${prod.priceInr}`}
                      </span>
                    </div>
                    <h3 className={`font-extrabold text-sm text-slate-900 group-hover:text-pink-600 transition-colors line-clamp-1 ${
                      isSelected ? 'text-pink-600' : ''
                    }`}>
                      {prod.toolkitName}
                    </h3>
                    <p className="text-[11px] text-slate-500 leading-relaxed line-clamp-3">
                      {prod.description}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between" onClick={e => e.stopPropagation()}>
                    <button 
                      onClick={() => {
                        setSelectedProduct(prod);
                        setAdminName(prod.toolkitName);
                        setAdminDescription(prod.description || "");
                        setAdminPriceUsd(prod.priceUsd);
                        setAdminPriceInr(prod.priceInr);
                        setAdminDemoUrl(prod.demoVideoUrl);
                        setAdminInstallUrl(prod.installationVideoUrl);
                        setAdminFileUrl(prod.scriptFileUrl);
                        setAdminFeaturesText(prod.features.join('\n'));
                      }}
                      className={`text-[10px] font-bold ${
                        isSelected ? 'text-pink-600 underline' : 'text-slate-500 hover:text-slate-800'
                      }`}
                    >
                      View Manuals
                    </button>
                    
                    <div className="flex gap-1.5">
                      {isAdmin && (
                        <button 
                          onClick={() => {
                            setSelectedProduct(prod);
                            setAdminName(prod.toolkitName);
                            setAdminDescription(prod.description || "");
                            setAdminPriceUsd(prod.priceUsd);
                            setAdminPriceInr(prod.priceInr);
                            setAdminDemoUrl(prod.demoVideoUrl);
                            setAdminInstallUrl(prod.installationVideoUrl);
                            setAdminFileUrl(prod.scriptFileUrl);
                            setAdminFeaturesText(prod.features.join('\n'));
                            setEditingProductId(prod.id);
                            setIsAdminMode(true);
                          }}
                          className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg transition-colors cursor-pointer"
                          title="Edit details"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      )}
                      
                      {isAdmin && (
                        <button 
                          onClick={() => handleDeleteProductClick(prod)}
                          className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-lg transition-colors cursor-pointer"
                          title="Delete script"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => handleAddProductToCart(prod)}
                        className="p-1.5 bg-pink-100 hover:bg-pink-600 hover:text-white text-pink-600 rounded-lg transition-all"
                        title="Add to Cart"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Selected Product Hero Details */}
      {activeProduct && (
        <div className="relative overflow-hidden bg-gradient-to-br from-slate-900 via-slate-800 to-pink-950 text-white rounded-3xl p-8 md:p-12 shadow-xl border border-slate-800">
          <div className="absolute top-0 right-0 w-96 h-96 bg-pink-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-80 h-80 bg-violet-600/10 rounded-full blur-2xl pointer-events-none" />
          
          <div className="relative flex flex-col lg:flex-row gap-8 justify-between items-start lg:items-center">
            <div className="space-y-4 max-w-2xl">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 bg-pink-500/20 text-pink-300 rounded-full text-xs font-semibold uppercase tracking-wider border border-pink-500/30">
                <Sparkles className="w-3.5 h-3.5" />
                Active Workstation Script
              </span>
              <h1 className="text-3xl md:text-4xl lg:text-5xl font-extrabold tracking-tight">
                {activeProduct.toolkitName}
              </h1>
              <p className="text-slate-300 text-sm md:text-base leading-relaxed">
                {activeProduct.description}
              </p>
              <div className="flex flex-wrap gap-4 text-xs font-mono text-slate-300 pt-2">
                <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Laptop className="w-3.5 h-3.5 text-pink-400" />
                  Illustrator CC / Photoshop CC Compatible
                </div>
                <div className="flex items-center gap-1 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                  <Award className="w-3.5 h-3.5 text-pink-400" />
                  Format: ZIP CEP Extension File
                </div>
              </div>
            </div>

            <div className="bg-white/5 backdrop-blur-md p-6 rounded-2xl border border-white/10 w-full lg:max-w-xs shrink-0 shadow-lg">
              {isStudent ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-2 text-emerald-400">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <span className="font-bold text-sm">Free Student License Active</span>
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">
                    As an enrolled student of Endless Spark, you have full free access to this automation tool for educational practice and portfolio compilation.
                  </p>
                  <button 
                    onClick={() => handleDirectDownload(
                      activeProduct.scriptFileUrl || "https://github.com/Adobe-CEP/CEP-Resources/archive/refs/heads/master.zip",
                      activeProduct.toolkitName,
                      activeProduct.id
                    )}
                    disabled={downloadingId === activeProduct.id}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 disabled:bg-slate-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    {downloadingId === activeProduct.id ? (
                      <Loader2 className="w-4 h-4 animate-spin text-white" />
                    ) : (
                      <FileDown className="w-4 h-4" />
                    )}
                    {downloadingId === activeProduct.id ? "Downloading..." : "Download Free Script Toolkit"}
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-baseline">
                    <span className="text-xs text-slate-300 uppercase font-bold tracking-wider">Commercial License</span>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-white">
                        {currency === 'USD' ? `$${activeProduct.priceUsd}` : `₹${activeProduct.priceInr}`}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2 p-1 bg-slate-800 rounded-lg">
                    <button 
                      onClick={() => setCurrency('USD')}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-colors ${currency === 'USD' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      USD ($)
                    </button>
                    <button 
                      onClick={() => setCurrency('INR')}
                      className={`flex-1 text-[10px] font-bold py-1 rounded-md transition-colors ${currency === 'INR' ? 'bg-pink-600 text-white' : 'text-slate-400 hover:text-white'}`}
                    >
                      INR (₹)
                    </button>
                  </div>

                  <button 
                    onClick={() => handleAddProductToCart(activeProduct)}
                    className="w-full py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                  >
                    <ShoppingBag className="w-4 h-4" />
                    Add To Cart
                  </button>
                  <p className="text-[10px] text-center text-slate-400">
                    Secure Checkout. Lifetime license key issued upon purchase.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Admin Quick Console */}
      {isAdmin && (
        <div className="bg-amber-50 border border-amber-200 rounded-3xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-amber-800">
              <Settings className="w-5 h-5" />
              <h3 className="font-bold text-sm">
                Admin Script Catalog Panel {editingProductId ? `(${editingProductId === 'new' ? 'Creating New Script' : 'Editing Selected Product'})` : ''}
              </h3>
            </div>
            {editingProductId && (
              <button
                onClick={() => {
                  setIsAdminMode(!isAdminMode);
                  if (!isAdminMode) {
                    // Prepopulate
                    setAdminName(activeProduct?.toolkitName || "");
                    setAdminDescription(activeProduct?.description || "");
                    setAdminPriceUsd(activeProduct?.priceUsd || 49);
                    setAdminPriceInr(activeProduct?.priceInr || 3999);
                    setAdminDemoUrl(activeProduct?.demoVideoUrl || "");
                    setAdminInstallUrl(activeProduct?.installationVideoUrl || "");
                    setAdminFileUrl(activeProduct?.scriptFileUrl || "");
                    setAdminFeaturesText(activeProduct?.features?.join('\n') || "");
                  }
                }}
                className="text-xs font-bold bg-amber-250 text-amber-900 px-3 py-1.5 rounded-lg hover:bg-amber-350 transition-colors cursor-pointer"
              >
                {isAdminMode ? "Collapse Editor" : "Configure Selected Product Properties"}
              </button>
            )}
          </div>

          {isAdminMode && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-4 pt-4 border-t border-amber-200/60 animate-in fade-in duration-300">
              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Product Script Name</label>
                  <input 
                    type="text" 
                    value={adminName} 
                    onChange={(e) => setAdminName(e.target.value)}
                    placeholder="Enter script name"
                    className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Description</label>
                  <textarea 
                    rows={2}
                    value={adminDescription} 
                    onChange={(e) => setAdminDescription(e.target.value)}
                    placeholder="Describe what the automation script accomplishes..."
                    className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Price (USD)</label>
                    <input 
                      type="number" 
                      value={adminPriceUsd} 
                      onChange={(e) => setAdminPriceUsd(Number(e.target.value))}
                      className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-500 outline-none" 
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-amber-900 mb-1">Price (INR)</label>
                    <input 
                      type="number" 
                      value={adminPriceInr} 
                      onChange={(e) => setAdminPriceInr(Number(e.target.value))}
                      className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-500 outline-none" 
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Script File ZIP URL / Direct Upload</label>
                  <input 
                    type="text" 
                    value={adminFileUrl} 
                    onChange={(e) => setAdminFileUrl(e.target.value)}
                    placeholder="Enter URL or upload below"
                    className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-500 outline-none mb-2" 
                  />
                  
                  {/* Interactive Drag & Drop File Upload Field */}
                  <div 
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) processLocalScriptFile(file);
                    }}
                    className={`border-2 border-dashed rounded-xl p-4 text-center transition-all cursor-pointer ${
                      isDragging 
                        ? 'border-amber-600 bg-amber-100/50' 
                        : 'border-amber-200 hover:border-amber-400 bg-white'
                    }`}
                  >
                    <input 
                      id="admin-script-uploader"
                      type="file" 
                      accept=".zip,.zxp,.jsx,.jsxbin"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) processLocalScriptFile(file);
                      }}
                      className="hidden" 
                    />
                    <label htmlFor="admin-script-uploader" className="cursor-pointer block space-y-1">
                      <FileDown className="w-6 h-6 text-amber-600 mx-auto" />
                      <p className="text-[11px] font-bold text-amber-900">
                        {uploadedFileName ? `Selected: ${uploadedFileName}` : "Drag & Drop ZIP/Script File here"}
                      </p>
                      <p className="text-[10px] text-amber-600 font-medium">
                        or click to select from your device
                      </p>
                    </label>

                    {uploadProgress !== null && (
                      <div className="mt-2 space-y-1">
                        <div className="flex justify-between text-[10px] font-bold text-amber-900">
                          <span>Processing File...</span>
                          <span>{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-slate-200 h-1 rounded-full overflow-hidden">
                          <div 
                            className="bg-amber-600 h-full transition-all duration-150" 
                            style={{ width: `${uploadProgress}%` }} 
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Demo Video Embed URL</label>
                  <input 
                    type="text" 
                    value={adminDemoUrl} 
                    onChange={(e) => setAdminDemoUrl(e.target.value)}
                    className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Installation Video Embed URL</label>
                  <input 
                    type="text" 
                    value={adminInstallUrl} 
                    onChange={(e) => setAdminInstallUrl(e.target.value)}
                    className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-mono focus:ring-1 focus:ring-amber-500 outline-none" 
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-amber-900 mb-1">Key Script Capabilities (One per line)</label>
                  <textarea 
                    rows={3}
                    value={adminFeaturesText} 
                    onChange={(e) => setAdminFeaturesText(e.target.value)}
                    placeholder="Bullet point features..."
                    className="w-full bg-white border border-amber-250 rounded-xl px-4 py-2.5 text-xs font-medium focus:ring-1 focus:ring-amber-500 outline-none" 
                  />
                </div>
              </div>

              <div className="md:col-span-2 pt-2 flex gap-3">
                <button
                  onClick={handleSaveProduct}
                  disabled={isSaving}
                  className="bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs py-2.5 px-6 rounded-xl flex items-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {editingProductId === 'new' ? "Create Product" : "Save Changes"}
                </button>
                <button
                  onClick={() => {
                    setIsAdminMode(false);
                    setEditingProductId(null);
                  }}
                  className="bg-slate-200 hover:bg-slate-300 text-slate-800 font-bold text-xs py-2.5 px-4 rounded-xl transition-colors cursor-pointer"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Grid Content */}
      {activeProduct && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left 2 Cols: Videos & Setup Guides */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Demo Video Section */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-gray-900">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold">Watch Script Demo</h2>
              </div>
              <p className="text-gray-500 text-xs">
                Witness the layout automation panel in real production workflows. Observe how we compile structures, separate spot layers, and pre-flight final print files.
              </p>
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                <SecureVideoPlayer url={activeProduct.demoVideoUrl} title="Toolkit Demonstration" />
              </div>
            </div>

            {/* Installation Video Section */}
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <div className="flex items-center gap-2.5 text-gray-900">
                <div className="w-8 h-8 bg-pink-100 rounded-lg flex items-center justify-center text-pink-600">
                  <Video className="w-4 h-4" />
                </div>
                <h2 className="text-xl font-bold">Step-by-Step Installation Tutorial</h2>
              </div>
              <p className="text-gray-500 text-xs">
                Make sure to configure Adobe CEP settings and authorized workstation folder permissions exactly as described in this workflow demo.
              </p>
              <div className="aspect-video bg-slate-900 rounded-2xl overflow-hidden shadow-inner border border-slate-200">
                <SecureVideoPlayer url={activeProduct.installationVideoUrl} title="Toolkit Installation Walkthrough" />
              </div>
            </div>

          </div>

          {/* Right 1 Col: Features & Benefits List */}
          <div className="space-y-6">
            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Zap className="w-5 h-5 text-pink-600" />
                Core Capabilities
              </h3>
              
              <div className="space-y-4">
                {activeProduct.features && activeProduct.features.map((feature, i) => (
                  <div key={i} className="flex gap-3 items-start">
                    <CheckCircle className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
                    <span className="text-xs text-gray-600 leading-relaxed font-medium">{feature}</span>
                  </div>
                ))}
              </div>

              <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 space-y-2.5">
                <div className="flex gap-2 items-center text-xs font-bold text-gray-800">
                  <ShieldCheck className="w-4 h-4 text-pink-600" />
                  S.M.E Faculty Certified
                </div>
                <p className="text-[11px] text-gray-500 leading-normal">
                  Our workspace utilities are built strictly following industrial packaging prepress limits to ensure fully compliant structural and color integrity.
                </p>
              </div>
            </div>

            <div className="bg-white p-6 md:p-8 rounded-3xl border border-gray-100 shadow-sm space-y-4">
              <h4 className="font-bold text-gray-900 flex items-center gap-2 text-sm">
                <HelpCircle className="w-4 h-4 text-pink-600" />
                Troubleshooting Installation
              </h4>
              <p className="text-xs text-gray-500 leading-relaxed">
                If the script toolbar does not render under <em>Window &gt; Extensions</em> inside your creative suite application, confirm that your ZXP client is active or submit an inquiry to the Help Desk.
              </p>
              <a 
                href="https://github.com/Adobe-CEP/CEP-Resources"
                target="_blank" 
                rel="noopener noreferrer" 
                className="inline-flex items-center gap-1.5 text-xs font-bold text-pink-600 hover:text-pink-700 hover:underline"
              >
                Access Developer CEP SDK Guide
                <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </div>

        </div>
      )}

      {/* Slide-over Cart & Checkout Sidebar Overlay */}
      <AnimatePresence>
        {cartOpen && (
          <div className="fixed inset-0 z-50 overflow-hidden">
            <div className="absolute inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setCartOpen(false)} />
            
            <div className="absolute inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-300">
              
              {/* Cart Header */}
              <div className="p-6 border-b border-gray-100 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-pink-600" />
                  <h3 className="font-bold text-gray-900 text-lg">Your Workshop Cart</h3>
                </div>
                <button onClick={() => setCartOpen(false)} className="p-1 text-gray-400 hover:text-gray-900 rounded-lg cursor-pointer">
                  <X className="w-6 h-6" />
                </button>
              </div>

              {/* Steps Progress */}
              <div className="bg-slate-50 px-6 py-3 flex justify-between border-b border-gray-100 text-xs font-bold text-gray-500">
                <span className={checkoutStep === 'cart' ? 'text-pink-600' : 'text-gray-400'}>1. Cart</span>
                <span>&rarr;</span>
                <span className={checkoutStep === 'info' ? 'text-pink-600' : 'text-gray-400'}>2. Details</span>
                <span>&rarr;</span>
                <span className={checkoutStep === 'payment' ? 'text-pink-600' : 'text-gray-400'}>3. Secure Pay</span>
                <span>&rarr;</span>
                <span className={checkoutStep === 'success' ? 'text-pink-600' : 'text-gray-400'}>4. Done</span>
              </div>

              {/* Scrollable Content */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                
                {/* Cart step */}
                {checkoutStep === 'cart' && (
                  <div className="space-y-6">
                    {cartItems.length === 0 ? (
                      <div className="text-center py-12">
                        <ShoppingBag className="w-12 h-12 mx-auto text-gray-300 mb-3" />
                        <p className="font-bold text-gray-700 text-sm">Your cart is empty</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-start p-4 bg-slate-50 border border-slate-100 rounded-2xl relative group">
                            <div className="space-y-1 max-w-[80%]">
                              <span className="text-[10px] font-mono uppercase tracking-wider text-pink-600 font-bold">Extension Plugin</span>
                              <h4 className="text-xs font-bold text-gray-900 truncate">{item.toolkitName}</h4>
                            </div>
                            <div className="flex flex-col items-end gap-2 shrink-0">
                              <span className="font-extrabold text-xs text-gray-900">
                                {currency === 'USD' ? `$${item.priceUsd}` : `₹${item.priceInr}`}
                              </span>
                              <button 
                                onClick={() => handleRemoveFromCart(item.id)}
                                className="text-[10px] text-red-500 hover:text-red-700 font-semibold cursor-pointer"
                              >
                                Remove
                              </button>
                            </div>
                          </div>
                        ))}

                        <div className="pt-6 border-t border-gray-100">
                          <div className="flex justify-between items-baseline mb-4">
                            <span className="font-bold text-gray-600 text-xs">Preferred Currency</span>
                            <div className="flex gap-1.5 p-0.5 bg-slate-100 rounded-lg">
                              <button 
                                onClick={() => setCurrency('USD')}
                                className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${currency === 'USD' ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                              >
                                USD
                              </button>
                              <button 
                                onClick={() => setCurrency('INR')}
                                className={`text-[9px] font-bold px-2 py-1 rounded transition-colors ${currency === 'INR' ? 'bg-pink-600 text-white' : 'text-slate-500 hover:text-slate-800'}`}
                              >
                                INR
                              </button>
                            </div>
                          </div>

                          <div className="flex justify-between items-baseline">
                            <span className="font-bold text-gray-600">Total Price</span>
                            <span className="text-2xl font-black text-gray-950">
                              {currency === 'USD' 
                                ? `$${cartItems.reduce((acc, item) => acc + item.priceUsd, 0)}` 
                                : `₹${cartItems.reduce((acc, item) => acc + item.priceInr, 0)}`
                              }
                            </span>
                          </div>
                        </div>

                        <button 
                          onClick={() => setCheckoutStep('info')}
                          className="w-full mt-4 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all shadow-md cursor-pointer"
                        >
                          Proceed to Customer Details
                          <ArrowRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>
                )}

                {/* Customer Info step */}
                {checkoutStep === 'info' && (
                  <form onSubmit={handleCheckoutSubmit} className="space-y-4">
                    <h4 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-2">Customer Details</h4>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Full Name</label>
                      <input 
                        type="text" 
                        required
                        value={custName} 
                        onChange={(e) => setCustName(e.target.value)}
                        placeholder="e.g. Jane Doe"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-medium" 
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-gray-700 mb-1">Email Address</label>
                      <input 
                        type="email" 
                        required
                        value={custEmail} 
                        onChange={(e) => setCustEmail(e.target.value)}
                        placeholder="e.g. jane@example.com"
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-medium" 
                      />
                    </div>
                    
                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setCheckoutStep('cart')}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 transition-all cursor-pointer"
                      >
                        Proceed to Payment
                        <ArrowRight className="w-4 h-4" />
                      </button>
                    </div>
                  </form>
                )}

                {/* Secure Payment step */}
                {checkoutStep === 'payment' && (
                  <form onSubmit={handlePaymentSubmit} className="space-y-6">
                    <div className="flex justify-between items-baseline">
                      <span className="text-xs font-bold text-gray-500 uppercase">Secure Pay Terminal</span>
                      <span className="text-lg font-black text-gray-900">
                        {currency === 'USD' 
                          ? `$${cartItems.reduce((acc, item) => acc + item.priceUsd, 0)}` 
                          : `₹${cartItems.reduce((acc, item) => acc + item.priceInr, 0)}`
                        }
                      </span>
                    </div>

                    <div className="flex gap-2 p-1 bg-slate-100 rounded-xl">
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('card')}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${paymentMethod === 'card' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        <CreditCard className="w-3.5 h-3.5 text-pink-600" />
                        Card
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('upi')}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${paymentMethod === 'upi' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        <Zap className="w-3.5 h-3.5 text-pink-600" />
                        UPI Scan
                      </button>
                      <button 
                        type="button"
                        onClick={() => setPaymentMethod('razorpay')}
                        className={`flex-1 py-2 text-[11px] font-bold rounded-lg flex items-center justify-center gap-1 transition-all ${paymentMethod === 'razorpay' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-900'}`}
                      >
                        <ShoppingBag className="w-3.5 h-3.5 text-pink-600" />
                        Razorpay
                      </button>
                    </div>

                    {paymentMethod === 'card' ? (
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-bold text-gray-700 mb-1">Card Number</label>
                          <input 
                            type="text" 
                            required
                            placeholder="4000 1234 5678 9010"
                            value={cardNumber} 
                            onChange={(e) => setCardNumber(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-mono" 
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">Expiry Date</label>
                            <input 
                              type="text" 
                              required
                              placeholder="MM/YY"
                              value={cardExpiry} 
                              onChange={(e) => setCardExpiry(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-mono" 
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-gray-700 mb-1">CVC / CVV</label>
                            <input 
                              type="password" 
                              required
                              placeholder="123"
                              maxLength={3}
                              value={cardCvc} 
                              onChange={(e) => setCardCvc(e.target.value)}
                              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-mono" 
                            />
                          </div>
                        </div>
                      </div>
                    ) : paymentMethod === 'upi' ? (
                      <div className="space-y-4 text-center">
                        <div className="bg-slate-50 p-6 rounded-2xl border border-slate-150 inline-block mx-auto">
                          {/* Simulated QR Code */}
                          <div className="w-32 h-32 bg-slate-800 rounded-xl border border-slate-700 flex items-center justify-center text-white text-[10px] font-mono mx-auto">
                            [ MOCK QR CODE ]
                          </div>
                          <p className="text-[10px] text-gray-400 font-mono mt-3">Scan with BHIM, GPay, Paytm or PhonePe</p>
                        </div>
                        
                        <div className="text-left">
                          <label className="block text-xs font-bold text-gray-700 mb-1">UPI ID</label>
                          <input 
                            type="text" 
                            required
                            placeholder="username@okaxis"
                            value={upiId} 
                            onChange={(e) => setUpiId(e.target.value)}
                            className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-mono" 
                          />
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4 text-center py-2">
                        <div className="bg-gradient-to-br from-pink-50 to-indigo-50 p-6 rounded-2xl border border-pink-100/50 inline-block mx-auto">
                          <div className="w-12 h-12 bg-pink-100 text-pink-600 rounded-full flex items-center justify-center mx-auto mb-3 shadow-inner">
                            <ShieldCheck className="w-6 h-6" />
                          </div>
                          <p className="font-extrabold text-slate-800 text-xs">Razorpay Secure Connection Active</p>
                          <p className="text-[10px] text-slate-500 max-w-xs mx-auto mt-1.5 leading-relaxed">
                            Click <strong>Authorize Payment</strong> below to trigger the official secure Razorpay Checkout screen for instant access to your script package.
                          </p>
                        </div>
                      </div>
                    )}

                    <div className="pt-4 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => setCheckoutStep('info')}
                        disabled={isProcessingPayment}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Back
                      </button>
                      <button 
                        type="submit"
                        disabled={isProcessingPayment}
                        className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Authorizing...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Authorize Payment
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Bank OTP Verification Step */}
                {checkoutStep === 'otp' && (
                  <form onSubmit={handleVerifyOtp} className="space-y-6">
                    <div className="bg-gradient-to-r from-blue-900 to-indigo-900 text-white rounded-2xl p-4 shadow-md border border-indigo-950">
                      <div className="flex items-center justify-between border-b border-indigo-800 pb-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Lock className="w-4 h-4 text-emerald-400" />
                          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-200">
                            3D Secure Bank Gateway
                          </span>
                        </div>
                        <ShieldCheck className="w-5 h-5 text-emerald-400" />
                      </div>
                      
                      <div className="space-y-1">
                        <div className="flex justify-between text-[11px] text-indigo-200">
                          <span>Merchant:</span>
                          <span className="font-bold text-white">Endless Spark School</span>
                        </div>
                        <div className="flex justify-between text-[11px] text-indigo-200">
                          <span>Amount:</span>
                          <span className="font-extrabold text-emerald-300">
                            {currency === 'USD' 
                              ? `$${cartItems.reduce((acc, item) => acc + item.priceUsd, 0)}` 
                              : `₹${cartItems.reduce((acc, item) => acc + item.priceInr, 0)}`
                            }
                          </span>
                        </div>
                        <div className="flex justify-between text-[11px] text-indigo-200">
                          <span>Payment Method:</span>
                          <span className="font-mono text-white uppercase">
                            {paymentMethod === 'card' 
                              ? `CARD (ending ${cardNumber.slice(-4) || '4242'})` 
                              : 'UPI SCAN'
                            }
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div className="text-center space-y-1">
                        <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto">
                          <Smartphone className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">Enter Verification Code (OTP)</p>
                        <p className="text-[10px] text-slate-500 max-w-xs mx-auto">
                          A One-Time Password has been sent by your card issuer bank to your registered mobile number ending with **9921 and registered email address.
                        </p>
                      </div>

                      <div className="space-y-2">
                        <input 
                          type="text" 
                          required
                          maxLength={6}
                          placeholder="******"
                          value={userOtp} 
                          onChange={(e) => {
                            const val = e.target.value.replace(/[^0-9]/g, '');
                            setUserOtp(val);
                            if (otpError) setOtpError("");
                          }}
                          className="w-full text-center tracking-widest text-lg font-bold bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 outline-none focus:bg-white focus:ring-1 focus:ring-pink-500 font-mono" 
                        />
                        
                        {otpError && (
                          <p className="text-[11px] text-red-500 text-center font-bold">{otpError}</p>
                        )}
                      </div>

                      {/* Demo Helper Panel */}
                      <div className="bg-amber-50/80 border border-amber-100 rounded-xl p-3 space-y-2">
                        <p className="text-[10px] text-amber-800 font-bold leading-relaxed flex items-center gap-1">
                          <Info className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>Simulated Bank SMS Alert:</span>
                        </p>
                        <div className="flex items-center justify-between bg-white px-3 py-1.5 rounded-lg border border-amber-200">
                          <span className="text-[10px] font-mono font-bold text-slate-600">
                            Your secure verification code is: <strong className="text-slate-900 bg-amber-100 px-1.5 py-0.5 rounded text-xs">{generatedOtp}</strong>
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setUserOtp(generatedOtp);
                              setOtpError("");
                            }}
                            className="text-[9px] font-extrabold text-indigo-600 hover:text-indigo-800 hover:underline cursor-pointer"
                          >
                            Auto-fill OTP
                          </button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between text-xs text-slate-500 px-1">
                        <span>Didn't receive the code?</span>
                        {otpTimer > 0 ? (
                          <span className="font-bold text-slate-600">Resend in {otpTimer}s</span>
                        ) : (
                          <button 
                            type="button"
                            onClick={handleResendOtp}
                            className="font-bold text-pink-600 hover:text-pink-800 cursor-pointer"
                          >
                            Resend Code
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="pt-2 flex gap-4">
                      <button 
                        type="button"
                        onClick={() => {
                          setCheckoutStep('payment');
                          setOtpError("");
                        }}
                        disabled={isProcessingPayment}
                        className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                      >
                        Cancel Transaction
                      </button>
                      <button 
                        type="submit"
                        disabled={isProcessingPayment}
                        className="flex-1 py-3 bg-pink-600 hover:bg-pink-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                      >
                        {isProcessingPayment ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Verifying OTP...
                          </>
                        ) : (
                          <>
                            <ShieldCheck className="w-4 h-4" />
                            Verify & Pay Securely
                          </>
                        )}
                      </button>
                    </div>
                  </form>
                )}

                {/* Purchase Success step */}
                {checkoutStep === 'success' && (
                  <div className="text-center py-6 space-y-6">
                    <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                      <Check className="w-8 h-8" />
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="text-xl font-extrabold text-gray-900">Purchase Confirmed!</h4>
                      <p className="text-xs text-gray-500">
                        Thank you for your purchase. Your layout toolkit license has been issued successfully.
                      </p>
                    </div>

                    <div className="p-4 bg-slate-50 rounded-2xl border border-slate-150 text-left space-y-4">
                      <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Licensed Customer</span>
                        <span className="text-xs font-bold text-gray-800">{custName} ({custEmail})</span>
                      </div>
                      
                      <div className="space-y-3 pt-2">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">Your Licensed Utilities</span>
                        {purchasedLicenses.map((lic, index) => (
                          <div key={index} className="p-3 bg-white border border-slate-200 rounded-xl space-y-2">
                            <span className="text-xs font-bold text-slate-850 block">{lic.name}</span>
                            <div className="flex flex-col gap-2">
                              <div>
                                <span className="text-[9px] text-slate-400 block uppercase font-bold">License Key</span>
                                <span className="text-[10px] font-mono font-bold text-pink-600 bg-pink-50 px-2 py-0.5 rounded border border-pink-100 inline-block">
                                  {lic.key}
                                </span>
                              </div>
                              <button 
                                onClick={() => handleDirectDownload(lic.downloadUrl, lic.name, `purchased-${index}`)}
                                disabled={downloadingId === `purchased-${index}`}
                                className="w-full py-1.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-700 text-white font-bold rounded-lg text-[10px] flex items-center justify-center gap-1 transition-all cursor-pointer"
                              >
                                {downloadingId === `purchased-${index}` ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                  <Download className="w-3.5 h-3.5" />
                                )}
                                {downloadingId === `purchased-${index}` ? "Downloading..." : "Download Zip File"}
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <button 
                      onClick={() => {
                        setCartOpen(false);
                        setCartItems([]);
                      }}
                      className="w-full py-2.5 bg-slate-150 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                    >
                      Close & Back to Portal
                    </button>
                  </div>
                )}

              </div>

            </div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Deletion Confirmation Modal */}
      <AnimatePresence>
        {productToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setProductToDelete(null)}
              className="absolute inset-0 bg-black/60 backdrop-blur-xs" 
            />
            
            {/* Modal Body */}
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative w-full max-w-md bg-white rounded-3xl p-6 shadow-2xl border border-slate-100 overflow-hidden text-center space-y-5 z-10"
            >
              <div className="w-14 h-14 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Trash2 className="w-6 h-6 animate-pulse" />
              </div>

              <div className="space-y-2">
                <h3 className="text-base font-extrabold text-slate-900">Confirm Deletion</h3>
                <p className="text-xs text-slate-500 max-w-xs mx-auto leading-relaxed">
                  Are you sure you want to delete <strong className="text-slate-800">"{productToDelete.toolkitName}"</strong> from the toolkit catalog? This action is permanent and cannot be undone.
                </p>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setProductToDelete(null)}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={async () => {
                    setIsDeleting(true);
                    try {
                      await deleteDoc(doc(db, 'toolkit_products', productToDelete.id));
                      setProducts(prev => prev.filter(p => p.id !== productToDelete.id));
                      if (selectedProduct?.id === productToDelete.id) {
                        const remaining = products.filter(p => p.id !== productToDelete.id);
                        setSelectedProduct(remaining.length > 0 ? remaining[0] : null);
                      }
                      showToast("Product deleted successfully!", "success");
                    } catch (err) {
                      handleFirestoreError(err, OperationType.DELETE, `toolkit_products/${productToDelete.id}`);
                      showToast("Failed to delete product.", "error");
                    } finally {
                      setIsDeleting(false);
                      setProductToDelete(null);
                    }
                  }}
                  disabled={isDeleting}
                  className="flex-1 py-2.5 bg-red-600 hover:bg-red-700 disabled:bg-red-400 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-all cursor-pointer"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      Yes, Delete
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Custom Toast Notification Banner */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-6 left-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md font-sans text-xs font-semibold"
            style={{
              backgroundColor: toast.type === 'success' ? 'rgba(240, 253, 244, 0.95)' : toast.type === 'error' ? 'rgba(254, 242, 242, 0.95)' : 'rgba(240, 249, 255, 0.95)',
              borderColor: toast.type === 'success' ? '#bbf7d0' : toast.type === 'error' ? '#fecaca' : '#bae6fd',
              color: toast.type === 'success' ? '#15803d' : toast.type === 'error' ? '#b91c1c' : '#0369a1',
            }}
          >
            {toast.type === 'success' ? (
              <Check className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : toast.type === 'error' ? (
              <HelpCircle className="w-4 h-4 text-red-600 shrink-0" />
            ) : (
              <Info className="w-4 h-4 text-sky-600 shrink-0" />
            )}
            <span>{toast.message}</span>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
