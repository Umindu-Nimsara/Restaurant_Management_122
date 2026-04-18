"use client";

import { useEffect, useState, useMemo, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/lib/authContext';
import { menuService } from '@/lib/menuService';
import { tableService } from '@/lib/tableService';
import { orderService } from '@/lib/orderService';
import { Button } from '@/components/ui/button';
import {
  ShoppingCart,
  LogIn,
  UserPlus,
  Utensils,
  Search,
  LayoutGrid,
  X,
  Plus,
  Minus,
  ArrowRight,
  CheckCircle2,
  Trash2,
  MessageSquare,
  Clock,
  Calendar,
  User,
  LogOut,
  Facebook,
  Instagram,
  Twitter,
  CreditCard,
  Banknote,
  ChevronLeft
} from 'lucide-react';
import Image from 'next/image';
import Footer from '@/components/ui/footer';
import { cn } from '@/lib/utils';
import InvoiceSuccessDialog from '@/components/ui/InvoiceSuccessDialog';
import { generateInvoicePDF } from '@/lib/invoiceHelper';

function RootPageContent() {
  const { user, logout, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState(["All"]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [search, setSearch] = useState("");

  // Dialog & Order States
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showOrderForm, setShowOrderForm] = useState(false);
  const [cart, setCart] = useState([]);
  const [tables, setTables] = useState([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [orderType, setOrderType] = useState('Dine-In');
  const [customerPhone, setCustomerPhone] = useState("");
  const [orderNote, setOrderNote] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);
  const [checkoutStep, setCheckoutStep] = useState('FORM'); // 'FORM', 'PAYMENT', 'CARD'
  const [paymentMethod, setPaymentMethod] = useState(''); // 'CASH', 'CARD'
  const [cardDetails, setCardDetails] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [cardErrors, setCardErrors] = useState({ number: '', expiry: '', cvv: '' });

  // Invoice Success States
  const [createdOrder, setCreatedOrder] = useState(null);
  const [showInvoiceDialog, setShowInvoiceDialog] = useState(false);

  // Parse QR ?table= parameter
  useEffect(() => {
    const tableParam = searchParams.get('table');
    if (tableParam) {
      sessionStorage.setItem('scannedTableId', tableParam);
    }
  }, [searchParams]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const [menuData, catData] = await Promise.all([
          menuService.fetchMenuItems(),
          menuService.fetchCategories()
        ]);
        setItems(menuData || []);
        if (catData) {
          setCategories(["All", ...catData.map(c => c.name)]);
        }
      } catch (err) {
        console.error("Failed to fetch landing page data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (user && showOrderForm) {
      const fetchTablesAndReservations = async () => {
        try {
          const [tableData, res] = await Promise.all([
            tableService.fetchTables(),
            fetch(`${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api"}/reservations`, {
              headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
            })
          ]);

          let reservedTableIds = new Set();
          if (res.ok) {
            const resData = await res.json();
            if (resData.success) {
              const now = new Date();
              resData.data.forEach(r => {
                if (r.status !== 'CANCELLED' && r.status !== 'NO_SHOW') {
                  const start = new Date(r.startAt);
                  const end = new Date(r.endAt);
                  if (start <= now && end >= now) {
                    const tId = typeof r.tableId === 'object' ? r.tableId._id : r.tableId;
                    if (tId) reservedTableIds.add(tId);
                  }
                }
              });
            }
          }

          if (tableData) {
            setTables(tableData.filter(t => !reservedTableIds.has(t._id)));
            
            // Auto-select pre-assigned table if available
            const savedTable = sessionStorage.getItem('scannedTableId');
            if (savedTable && orderType === 'Dine-In') {
              setSelectedTable(savedTable);
            }
          } else {
            setTables([]);
          }
        } catch (err) {
          console.error("Failed to fetch tables or reservations:", err);
        }
      };
      fetchTablesAndReservations();
    }
  }, [user, showOrderForm, orderType]);

  const groupedItems = useMemo(() => {
    let result = [...items];
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(it => (it.name || it.menuName || "").toLowerCase().includes(q));
    }
    
    const grouped = {};
    if (activeCategory === "All") {
      categories.filter(c => c !== "All").forEach(c => { grouped[c] = []; });
      result.forEach(it => {
        const cat = it.categoryId?.name || it.category || "Uncategorized";
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(it);
      });
    } else {
      grouped[activeCategory] = [];
      result.forEach(it => {
        const cat = it.categoryId?.name || it.category || "Uncategorized";
        if (cat === activeCategory) {
          grouped[activeCategory].push(it);
        }
      });
    }

    Object.keys(grouped).forEach(cat => {
      if (grouped[cat].length === 0) delete grouped[cat];
    });

    return grouped;
  }, [items, activeCategory, search, categories]);

  const addToCart = (item) => {
    setCart(prev => {
      const existing = prev.find(i => i._id === item._id);
      if (existing) {
        return prev.map(i => i._id === item._id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { ...item, price: item.hasOwnProperty('effectivePrice') ? item.effectivePrice : item.price, qty: 1 }];
    });
  };

  const removeFromCart = (id) => {
    setCart(prev => prev.filter(i => i._id !== id));
  };

  const updateQty = (id, delta) => {
    setCart(prev => prev.map(i => {
      if (i._id === id) {
        const newQty = Math.max(1, i.qty + delta);
        return { ...i, qty: newQty };
      }
      return i;
    }));
  };

  const validateCard = () => {
    const errors = { number: '', expiry: '', cvv: '' };
    let isValid = true;

    // Card Number: 16 digits
    if (!/^\d{16}$/.test(cardDetails.number.replace(/\s/g, ''))) {
      errors.number = "Card number must be exactly 16 digits.";
      isValid = false;
    }

    // CVV: 3 digits
    if (!/^\d{3}$/.test(cardDetails.cvv)) {
      errors.cvv = "CVV must be 3 digits.";
      isValid = false;
    }

    // Expiry: MM / YY and not in past
    const expiryRegex = /^(0[1-9]|1[0-2])\s*\/\s*([2-9][0-9])$/;
    const match = cardDetails.expiry.match(expiryRegex);
    if (!match) {
      errors.expiry = "Use MM / YY format (e.g., 12 / 25).";
      isValid = false;
    } else {
      const month = parseInt(match[1]);
      const year = parseInt("20" + match[2]);
      const now = new Date();
      const currentMonth = now.getMonth() + 1;
      const currentYear = now.getFullYear();

      if (year < currentYear || (year === currentYear && month < currentMonth)) {
        errors.expiry = "Expiry date cannot be in the past.";
        isValid = false;
      }
    }

    setCardErrors(errors);
    return isValid;
  };

  const handleOrderSubmit = async (methodOverride) => {
    // If method is passed directly (e.g. from cash button click), use it, otherwise fallback to state
    const activeMethod = typeof methodOverride === 'string' ? methodOverride : paymentMethod;

    if (orderType === 'Dine-In') {
      if (!selectedTable) {
        alert("Please select a table number.");
        return;
      }
    } else {
      if (!customerPhone) {
        alert("Please enter a phone number.");
        return;
      }
    }

    if (activeMethod === 'CARD' && !validateCard()) {
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = {
        orderType,
        customerName: user?.name,
        customerPhone: orderType === 'Takeaway' ? customerPhone : undefined,
        tableId: orderType === 'Dine-In' ? selectedTable : undefined,
        items: cart.map(i => ({
          menuItemId: i._id,
          qty: i.qty,
          price: i.price,
          note: ""
        })),
        notes: orderNote,
        totalAmount: totalCartPrice * 1.05,
        paymentMethod: activeMethod,
        ...(activeMethod === 'CARD' ? { cardLastFour: cardDetails.number.slice(-4) } : {})
      };
      const res = await orderService.createOrder(payload);
      setCreatedOrder(res);
      setShowInvoiceDialog(true);

      // Clear cart and close form immediately
      setCart([]);
      setShowOrderForm(false);
    } catch (err) {
      alert("Failed to place order: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const totalCartPrice = cart.reduce((acc, curr) => acc + (curr.price * curr.qty), 0);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E28]">
        <div className="animate-spin h-10 w-10 border-4 border-[#408c8c] border-t-transparent rounded-full" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0E28] text-white font-sans">
      {/* Header */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-[#0F0E28]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
          {/* Left: Logo */}
          <div className="flex items-center gap-3 shrink-0">
            <Image src="/OceanBreeze.png" width={140} height={40} alt="OceanBreeze" className="object-contain grayscale brightness-200" />
          </div>

          {/* Center: Navigation */}
          <nav className="hidden lg:flex items-center gap-10">
            <a href="#" className="text-slate-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group">
              <Utensils className="w-3.5 h-3.5 text-[#408c8c]" />
              Menu
            </a>
            <button
              onClick={() => {
                if (!user) router.push('/login');
                else router.push('/modules/customer-dashboard');
              }}
              className="text-slate-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group"
            >
              <Clock className="w-3.5 h-3.5 text-[#408c8c]" />
              Order Tracking
            </button>
            {/* <a href="#" className="text-slate-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-[0.2em] flex items-center gap-2 group">
              <Calendar className="w-3.5 h-3.5 text-[#408c8c]" />
              Reservations
            </a> */}
          </nav>

          {/* Right: Actions */}
          <div className="flex items-center gap-4">
            {user ? (
              <div className="flex items-center gap-2 md:gap-4">
                {/* Cart Toggle */}
                <Button
                  variant="ghost"
                  className="relative p-2.5 rounded-2xl hover:bg-white/5 border border-transparent hover:border-white/10 transition-all group"
                  onClick={() => setShowOrderForm(true)}
                >
                  <ShoppingCart className="w-5 h-5 text-slate-400 group-hover:text-white transition-colors" />
                  {cart.length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-[#408c8c] text-white text-[9px] font-black h-4.5 w-4.5 flex items-center justify-center rounded-full shadow-lg border-2 border-[#0F0E28]">
                      {cart.length}
                    </span>
                  )}
                </Button>

                <div className="h-6 w-[1px] bg-white/10 hidden md:block mx-1"></div>

                {/* Profile Link */}
                <Button
                  onClick={() => router.push('/profile')}
                  variant="ghost"
                  className="hidden md:flex items-center gap-2 text-slate-400 hover:text-white transition-all text-[11px] font-black uppercase tracking-widest hover:bg-white/5 rounded-2xl px-4"
                >
                  <User className="w-4 h-4 text-[#408c8c]" />
                  Profile
                </Button>

                {/* Dashboard Button */}
                {/* <Button
                  onClick={() => {
                    if (user.role === 'ADMIN') router.push('/modules/admin');
                    else if (user.role === 'CHEF') router.push('/modules/admin');
                    else router.push('/modules/customer-dashboard');
                  }}
                  className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-2xl px-6 h-11 font-black text-[11px] uppercase tracking-widest transition-all hidden sm:flex"
                >
                  Dashboard
                </Button> */}

                {/* Logout Button */}
                <Button
                  onClick={logout}
                  variant="ghost"
                  className="p-2.5 rounded-2xl hover:bg-red-500/10 hover:text-red-400 border border-transparent hover:border-red-500/20 text-slate-400 transition-all"
                  title="Logout"
                >
                  <LogOut className="w-5 h-5" />
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Button
                  variant="ghost"
                  onClick={() => router.push('/login')}
                  className="text-slate-400 hover:text-white hover:bg-white/5 rounded-2xl px-6 h-11 font-black text-[11px] uppercase tracking-widest transition-all"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => router.push('/register')}
                  className="bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-2xl px-7 h-11 font-black text-[11px] uppercase tracking-[0.2em] shadow-xl shadow-[#408c8c]/20 transition-all active:scale-95"
                >
                  Join Now
                </Button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="pt-32 pb-20 px-6 max-w-7xl mx-auto">
        {/* Premium Hero Banner Section */}
        <div className="relative w-full h-[400px] md:h-[500px] mb-16 rounded-[3rem] overflow-hidden group animate-in zoom-in-95 duration-1000 shadow-2xl">
          {/* Background Image with slight scale effect */}
          <div 
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[10s] ease-out group-hover:scale-110" 
            style={{ backgroundImage: "url('/hero_banner.jpg')" }} 
          />
          
          {/* Dark Gradient Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E28] via-[#0F0E28]/60 to-[#0F0E28]/20" />
          <div className="absolute inset-0 bg-black/20" />
          
          {/* Content Overlays */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-8 z-10">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md mb-6">
              <span className="w-2 h-2 rounded-full bg-[#408c8c] animate-pulse" />
              <span className="text-xs font-black uppercase tracking-[0.2em] text-white">Now Serving</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-5 bg-gradient-to-b from-white to-white/70 bg-clip-text text-transparent italic tracking-tight uppercase leading-tight drop-shadow-2xl">
            A Breeze of Flavor <br /> Crafted For You
            </h1>
            <p className="text-slate-200 text-sm md:text-lg max-w-2xl mx-auto font-medium drop-shadow-md leading-relaxed">
              Explore our curated menu of fine dining options. From traditional specialties to modern delights, we serve only the best.
            </p>
            
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Button 
                onClick={() => window.scrollTo({ top: window.innerHeight * 0.8, behavior: 'smooth' })} 
                className="bg-[#408c8c] hover:bg-[#408c8c]/80 text-white rounded-full px-10 h-14 font-black text-sm uppercase tracking-widest shadow-2xl shadow-[#408c8c]/30 hover:-translate-y-1 transition-all"
              >
                View Our Menu
              </Button>
            </div>
          </div>
        </div>

        {/* Search and Filters */}
        <div className="mb-12 space-y-8">
          <div className="relative max-w-xl mx-auto group">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500 group-hover:text-[#408c8c] transition-colors" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search dishes..."
              className="w-full h-14 pl-14 pr-6 bg-white/5 border border-white/10 rounded-2xl outline-none focus:border-[#408c8c] focus:ring-4 focus:ring-[#408c8c]/10 transition-all font-medium text-lg placeholder:text-slate-600"
            />
          </div>

          <div className="flex overflow-x-auto hide-scrollbar gap-2 mb-8 border-b border-white/10 max-w-fit mx-auto px-4 pb-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-6 py-4 text-sm font-black uppercase tracking-widest transition-all duration-300 whitespace-nowrap border-b-2",
                  activeCategory === cat
                    ? "border-[#408c8c] text-[#408c8c]"
                    : "border-transparent text-slate-400 hover:text-white hover:bg-white/5 bg-transparent rounded-t-xl"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid */}
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-4">
            <div className="animate-spin h-10 w-10 border-4 border-[#408c8c] border-t-transparent rounded-full" />
            <p className="text-slate-500 font-bold uppercase tracking-[0.2em] text-xs">Fetching Culinary Wonders...</p>
          </div>
        ) : Object.keys(groupedItems).length === 0 ? (
          <div className="text-center py-32 bg-white/5 rounded-[3rem] border border-white/10 border-dashed">
            <Utensils className="w-16 h-16 text-slate-700 mx-auto mb-6 opacity-20" />
            <h3 className="text-2xl font-black text-white mb-2">No Items Found</h3>
            <p className="text-slate-500 font-medium tracking-tight">Try adjusting your category or search term.</p>
          </div>
        ) : (
          <div className="space-y-16">
            {Object.entries(groupedItems).map(([category, catItems]) => (
              <div key={category} className="space-y-8 animate-in fade-in duration-700">
                <div className="flex items-center gap-6">
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter text-white">{category}</h2>
                  <div className="h-[1px] flex-1 bg-gradient-to-r from-white/20 to-transparent"></div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                  {catItems.map((item, idx) => (
              <div
                key={item._id}
                onClick={() => {
                  setSelectedItem(item);
                  setShowDetail(true);
                }}
                className="group relative bg-white/5 rounded-[2.5rem] border border-white/10 overflow-hidden hover:border-[#408c8c]/40 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-[#408c8c]/10 animate-in fade-in slide-in-from-bottom-8 duration-700 cursor-pointer"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="h-64 relative overflow-hidden">
                  {item.imageUrl && item.imageUrl !== 'no-photo.jpg' ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name || item.menuName}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                  ) : (
                    <div className="w-full h-full bg-black/20 flex items-center justify-center opacity-30">
                      <LayoutGrid className="w-12 h-12" />
                    </div>
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0F0E28] via-transparent to-transparent opacity-60" />
                  <div className="absolute top-6 left-6">
                    <span className="px-4 py-1.5 bg-[#408c8c] text-white text-[10px] font-black uppercase tracking-widest rounded-full shadow-lg">
                      {item.categoryId?.name || item.category || "Main"}
                    </span>
                  </div>
                </div>

                <div className="p-8">
                  <h4 className="text-xl font-black text-white mb-2 leading-tight group-hover:text-[#408c8c] transition-colors">
                    {item.name || item.menuName}
                  </h4>
                  <div className="flex items-center justify-between mt-6">
                    <div className="flex flex-col">
                      {item.hasOwnProperty('effectivePrice') && item.effectivePrice !== item.originalPrice && (
                        <span className="text-xs font-bold text-slate-500 line-through -mb-1">
                          LKR {Number(item.originalPrice).toLocaleString()}
                        </span>
                      )}
                      <span className={cn(
                        "text-2xl font-black tracking-tighter",
                        item.hasOwnProperty('effectivePrice') && item.effectivePrice < item.originalPrice ? "text-amber-400" :
                        item.hasOwnProperty('effectivePrice') && item.effectivePrice > item.originalPrice ? "text-rose-400" : "text-white"
                      )}>
                        LKR {Number(item.hasOwnProperty('effectivePrice') ? item.effectivePrice : item.price).toLocaleString()}
                      </span>
                      {item.hasOwnProperty('effectivePrice') && item.effectivePrice !== item.originalPrice ? (
                        <span className={cn("text-[10px] font-bold uppercase tracking-widest", item.effectivePrice < item.originalPrice ? "text-amber-500" : "text-rose-500")}>
                           ★ {item.dynamicPricing?.type === 'SURGE' ? 'Peak Hours' : 'Happy Hour'}
                        </span>
                      ) : (
                        <span className="text-[10px] font-bold text-[#408c8c] uppercase tracking-widest">Premium Selection</span>
                      )}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (!user) router.push('/login');
                        else addToCart(item);
                      }}
                      className="h-12 w-12 bg-white/5 border border-white/10 hover:bg-[#408c8c] hover:text-white rounded-2xl flex items-center justify-center transition-all group/btn active:scale-90"
                    >
                      <ShoppingCart className="w-5 h-5 transition-transform group-hover/btn:scale-110" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Menu Detail Modal */}
      {showDetail && selectedItem && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0F0E28]/95 backdrop-blur-xl" onClick={() => setShowDetail(false)} />
          <div className="relative w-full max-w-4xl bg-[#1a193c] border border-white/10 rounded-[3rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in zoom-in-95 duration-300">
            <button
              onClick={() => setShowDetail(false)}
              className="absolute top-6 right-6 z-10 p-3 rounded-full bg-black/40 text-white hover:bg-white/10 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="md:w-1/2 h-[300px] md:h-auto relative">
              {selectedItem.imageUrl && selectedItem.imageUrl !== 'no-photo.jpg' ? (
                <img src={selectedItem.imageUrl} alt="" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full bg-white/5 flex items-center justify-center">
                  <Utensils className="w-20 h-20 text-white/20" />
                </div>
              )}
            </div>

            <div className="md:w-1/2 p-10 flex flex-col">
              <div className="mb-2">
                <span className="px-4 py-1.5 bg-[#408c8c] text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                  {selectedItem.categoryId?.name || selectedItem.category}
                </span>
              </div>
              <h2 className="text-4xl font-black mb-4 uppercase italic tracking-tighter leading-none">{selectedItem.name || selectedItem.menuName}</h2>
              <p className="text-slate-400 font-medium text-lg leading-relaxed mb-8">
                {selectedItem.description || "A masterfully crafted dish using only the finest ingredients, specifically curated to provide an unforgettable culinary experience."}
              </p>

              <div className="flex items-center gap-3 mb-10">
                <div className="flex flex-col">
                  {selectedItem.hasOwnProperty('effectivePrice') && selectedItem.effectivePrice !== selectedItem.originalPrice && (
                    <span className="text-sm font-bold text-slate-500 line-through -mb-1">LKR {Number(selectedItem.originalPrice).toLocaleString()}</span>
                  )}
                  <span className={cn(
                    "text-4xl font-black",
                    selectedItem.hasOwnProperty('effectivePrice') && selectedItem.effectivePrice < selectedItem.originalPrice ? "text-amber-400" :
                    selectedItem.hasOwnProperty('effectivePrice') && selectedItem.effectivePrice > selectedItem.originalPrice ? "text-rose-400" : "text-white"
                  )}>
                    LKR {Number(selectedItem.hasOwnProperty('effectivePrice') ? selectedItem.effectivePrice : selectedItem.price).toLocaleString()}
                  </span>
                </div>
                {selectedItem.hasOwnProperty('effectivePrice') && selectedItem.effectivePrice !== selectedItem.originalPrice ? (
                  <span className={cn("text-xs font-bold uppercase px-3 py-1 rounded-lg", selectedItem.effectivePrice < selectedItem.originalPrice ? "bg-amber-500/10 text-amber-500" : "bg-rose-500/10 text-rose-500")}>
                    {selectedItem.dynamicPricing?.type === 'SURGE' ? 'Peak Hours' : 'Happy Hour'}
                  </span>
                ) : (
                  <span className="text-xs font-bold text-[#408c8c] uppercase bg-[#408c8c]/10 px-3 py-1 rounded-lg">Best Seller</span>
                )}
              </div>

              <div className="mt-auto flex gap-4">
                <Button
                  onClick={() => {
                    if (!user) router.push('/login');
                    else {
                      addToCart(selectedItem);
                      setShowDetail(false);
                    }
                  }}
                  className="flex-1 h-16 bg-white/5 border border-white/10 hover:bg-white/10 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm transition-all"
                >
                  Add to Cart
                </Button>
                <Button
                  onClick={() => {
                    if (!user) router.push('/login');
                    else {
                      if (!cart.find(i => i._id === selectedItem._id)) addToCart(selectedItem);
                      setShowDetail(false);
                      setShowOrderForm(true);
                    }
                  }}
                  className="flex-1 h-16 bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-[1.5rem] font-black uppercase tracking-widest text-sm shadow-xl shadow-[#408c8c]/20 transition-all"
                >
                  Order Now
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Order Placement Modal */}
      {showOrderForm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="absolute inset-0 bg-[#0F0E28]/95 backdrop-blur-2xl" onClick={() => !isSubmitting && setShowOrderForm(false)} />

          <div className="relative w-full max-w-5xl bg-[#1a193c] border border-white/10 rounded-[4rem] overflow-hidden flex flex-col md:flex-row shadow-2xl animate-in slide-in-from-bottom-12 duration-500">
            {!isSubmitting && (
              <button
                onClick={() => setShowOrderForm(false)}
                className="absolute top-8 right-8 z-10 p-3 rounded-full bg-white/5 text-white hover:bg-white/10 transition-colors"
              >
                <X className="w-6 h-6" />
              </button>
            )}

            {/* Left Side: Order Items */}
            <div className="md:w-3/5 p-12 border-r border-white/5 flex flex-col max-h-[85vh] overflow-y-auto scrollbar-hide">
              <div className="flex items-center gap-4 mb-10">
                <div className="h-14 w-14 bg-[#408c8c]/20 rounded-2xl flex items-center justify-center">
                  <ShoppingCart className="w-7 h-7 text-[#408c8c]" />
                </div>
                <div>
                  <h2 className="text-3xl font-black italic uppercase tracking-tighter">Your Selection</h2>
                  <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Confirm your items before placing order</p>
                </div>
              </div>

              <div className="space-y-6 flex-1">
                {cart.length === 0 ? (
                  <div className="text-center py-20 bg-white/5 rounded-[3rem] border border-white/5 border-dashed">
                    <Utensils className="w-12 h-12 text-slate-700 mx-auto mb-4 opacity-20" />
                    <p className="text-slate-500 font-bold uppercase text-xs tracking-widest">Your cart is empty</p>
                  </div>
                ) : (
                  cart.map(i => (
                    <div key={i._id} className="flex items-center gap-6 p-6 bg-white/5 rounded-[2rem] border border-white/5 hover:border-white/10 transition-all">
                      <div className="h-20 w-20 rounded-[1.5rem] overflow-hidden bg-black/20">
                        {i.imageUrl && i.imageUrl !== 'no-photo.jpg' ? (
                          <img src={i.imageUrl} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center opacity-20"><Utensils className="w-8 h-8" /></div>
                        )}
                      </div>
                      <div className="flex-1">
                        <h4 className="text-lg font-black uppercase italic tracking-tighter leading-tight">{i.name || i.menuName}</h4>
                        <p className="text-[#408c8c] font-black">LKR {i.price.toLocaleString()}</p>
                      </div>
                      <div className="flex items-center gap-4 bg-black/20 p-2 rounded-2xl">
                        <button onClick={() => updateQty(i._id, -1)} className="p-2 hover:bg-white/10 rounded-xl transition-colors"><Minus className="w-4 h-4" /></button>
                        <span className="text-lg font-black w-6 text-center">{i.qty}</span>
                        <button onClick={() => updateQty(i._id, 1)} className="p-2 hover:bg-[#408c8c] rounded-xl transition-colors"><Plus className="w-4 h-4" /></button>
                      </div>
                      <button onClick={() => removeFromCart(i._id)} className="p-3 text-slate-500 hover:text-red-500 transition-colors"><Trash2 className="w-5 h-5" /></button>
                    </div>
                  ))
                )}
              </div>

              {cart.length > 0 && (
                <div className="mt-10 p-8 bg-black/40 rounded-[2.5rem] border border-white/5">
                  <div className="flex justify-between items-center text-slate-400 mb-2 uppercase text-[10px] font-black tracking-widest">
                    <span>Subtotal</span>
                    <span>LKR {totalCartPrice.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-400 mb-6 uppercase text-[10px] font-black tracking-widest">
                    <span>Service Charge (5%)</span>
                    <span>LKR {(totalCartPrice * 0.05).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center border-t border-white/10 pt-6">
                    <span className="text-xl font-black uppercase italic tracking-tighter">Grand Total</span>
                    <span className="text-3xl font-black text-[#408c8c]">LKR {(totalCartPrice * 1.05).toLocaleString()}</span>
                  </div>
                </div>
              )}
            </div>

            {/* Right Side: Form / Payment / Card */}
            <div className="md:w-2/5 p-12 bg-white/5 flex flex-col relative">
              {orderSuccess ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center">
                  <div className="h-24 w-24 bg-[#408c8c] rounded-full flex items-center justify-center mb-6 shadow-2xl shadow-[#408c8c]/40 animate-bounce">
                    <CheckCircle2 className="w-12 h-12 text-white" />
                  </div>
                  <h2 className="text-4xl font-black uppercase italic tracking-tighter mb-4 leading-none">Order Placed!</h2>
                  <p className="text-slate-400 font-medium tracking-tight">Your culinary journey has begun. Our team will serve you shortly.</p>
                </div>
              ) : (
                <>
                  {/* Step Indicators */}
                  <div className="flex items-center gap-2 mb-8">
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", checkoutStep === 'FORM' ? "bg-[#408c8c]" : "bg-[#408c8c]/20")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", checkoutStep === 'PAYMENT' ? "bg-[#408c8c]" : "bg-[#408c8c]/20")} />
                    <div className={cn("h-1.5 flex-1 rounded-full transition-all duration-500", checkoutStep === 'CARD' ? "bg-[#408c8c]" : "bg-[#408c8c]/20")} />
                  </div>

                  {checkoutStep === 'FORM' && (
                    <>
                      <div className="mb-12">
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Service Details</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Confirm your identity and location</p>
                      </div>

                      <div className="space-y-8 flex-1">
                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Order Type</label>
                          <div className="flex bg-white/5 rounded-2xl p-1.5 border border-white/10">
                            <button
                              onClick={() => setOrderType('Dine-In')}
                              className={cn("flex-1 h-12 rounded-xl text-sm font-black uppercase tracking-widest transition-all", orderType === 'Dine-In' ? "bg-[#408c8c] text-white shadow-xl shadow-[#408c8c]/20" : "text-slate-400 hover:text-white hover:bg-white/5")}
                            >
                              Dine-In
                            </button>
                            <button
                              onClick={() => setOrderType('Takeaway')}
                              className={cn("flex-1 h-12 rounded-xl text-sm font-black uppercase tracking-widest transition-all", orderType === 'Takeaway' ? "bg-[#408c8c] text-white shadow-xl shadow-[#408c8c]/20" : "text-slate-400 hover:text-white hover:bg-white/5")}
                            >
                              Takeaway
                            </button>
                          </div>
                        </div>

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Dining Guest</label>
                          <div className="h-16 w-full rounded-2xl bg-white/5 border border-white/5 px-6 flex items-center text-lg font-black italic tracking-tighter text-white/40 cursor-not-allowed">
                            {user?.name}
                          </div>
                        </div>

                        {orderType === 'Dine-In' ? (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Select Table</label>
                            <select
                              value={selectedTable}
                              onChange={(e) => setSelectedTable(e.target.value)}
                              className="w-full h-16 rounded-3xl bg-[#0F0E28] border border-white/10 px-6 text-lg font-black italic tracking-tighter text-white outline-none focus:border-[#408c8c] focus:ring-4 focus:ring-[#408c8c]/10 transition-all appearance-none cursor-pointer"
                            >
                              <option value="">-- Choose Your Table --</option>
                              {tables.filter(t => t.status === 'AVAILABLE').map(t => (
                                <option key={t._id} value={t._id} className="bg-[#0F0E28]">
                                  Table {t.tableNumber} - {t.location} (Cap: {t.capacity})
                                </option>
                              ))}
                            </select>
                          </div>
                        ) : (
                          <div className="space-y-3">
                            <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Customer Phone</label>
                            <input
                              value={customerPhone}
                              onChange={(e) => setCustomerPhone(e.target.value)}
                              placeholder="07XXXXXXXX"
                              maxLength={10}
                              className="w-full h-16 rounded-3xl bg-[#0F0E28] border border-white/10 px-6 text-lg font-black italic tracking-tighter text-white outline-none focus:border-[#408c8c] focus:ring-4 focus:ring-[#408c8c]/10 transition-all placeholder:text-slate-600"
                            />
                          </div>
                        )}

                        <div className="space-y-3">
                          <label className="text-[10px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1 flex items-center gap-2">
                            <MessageSquare className="w-3 h-3" /> Special Notes
                          </label>
                          <textarea
                            value={orderNote}
                            onChange={(e) => setOrderNote(e.target.value)}
                            placeholder="Allergies, extra spice, or special requests..."
                            className="w-full h-32 rounded-3xl bg-white/5 border border-white/5 p-6 text-sm font-medium text-white outline-none focus:border-[#408c8c] focus:bg-white/[0.08] transition-all resize-none"
                          />
                        </div>
                      </div>

                      <Button
                        onClick={() => setCheckoutStep('PAYMENT')}
                        disabled={isSubmitting || cart.length === 0 || (orderType === 'Dine-In' ? !selectedTable : !customerPhone)}
                        className="w-full h-20 bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-[2rem] font-black uppercase italic tracking-[0.1em] text-lg shadow-2xl shadow-[#408c8c]/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30 disabled:grayscale mt-10"
                      >
                        Confirm & Order <ArrowRight className="w-6 h-6" />
                      </Button>
                    </>
                  )}

                  {checkoutStep === 'PAYMENT' && (
                    <div className="flex-1 flex flex-col justify-center">
                      <button
                        onClick={() => setCheckoutStep('FORM')}
                        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Details
                      </button>

                      <div className="text-center mb-12">
                        <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-2">Payment Method</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Select how you'd like to pay</p>
                      </div>

                      <div className="grid grid-cols-1 gap-6">
                        <button
                          onClick={() => {
                            setPaymentMethod('CASH');
                            handleOrderSubmit('CASH');
                          }}
                          className="group relative h-32 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#408c8c] hover:bg-[#408c8c]/5 transition-all p-8 flex items-center gap-6 overflow-hidden"
                        >
                          <div className="h-16 w-16 bg-[#408c8c]/20 rounded-[1.5rem] flex items-center justify-center group-hover:bg-[#408c8c] transition-colors">
                            <Banknote className="w-8 h-8 text-[#408c8c] group-hover:text-white" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-xl font-black uppercase italic tracking-tighter">Pay with Cash</h4>
                            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Payment at the counter</p>
                          </div>
                          <ArrowRight className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-[#408c8c]" />
                        </button>

                        <button
                          onClick={() => {
                            setPaymentMethod('CARD');
                            setCheckoutStep('CARD');
                          }}
                          className="group relative h-32 rounded-[2rem] bg-white/5 border border-white/10 hover:border-[#408c8c] hover:bg-[#408c8c]/5 transition-all p-8 flex items-center gap-6 overflow-hidden"
                        >
                          <div className="h-16 w-16 bg-[#408c8c]/20 rounded-[1.5rem] flex items-center justify-center group-hover:bg-[#408c8c] transition-colors">
                            <CreditCard className="w-8 h-8 text-[#408c8c] group-hover:text-white" />
                          </div>
                          <div className="text-left">
                            <h4 className="text-xl font-black uppercase italic tracking-tighter">Credit / Debit Card</h4>
                            <p className="text-slate-500 font-bold uppercase text-[9px] tracking-widest mt-1">Secure online payment</p>
                          </div>
                          <ArrowRight className="w-6 h-6 ml-auto opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all text-[#408c8c]" />
                        </button>
                      </div>
                    </div>
                  )}

                  {checkoutStep === 'CARD' && (
                    <div className="flex-1 flex flex-col pt-10">
                      <button
                        onClick={() => setCheckoutStep('PAYMENT')}
                        className="absolute top-8 left-8 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors"
                      >
                        <ChevronLeft className="w-4 h-4" /> Back to Payment
                      </button>

                      <div className="text-center mb-10">
                        <div className="h-16 w-16 bg-[#408c8c]/20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-4">
                          <CreditCard className="w-8 h-8 text-[#408c8c]" />
                        </div>
                        <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-2">Card Details</h3>
                        <p className="text-slate-500 font-bold uppercase text-[10px] tracking-widest">Enter your card information</p>
                      </div>

                      <div className="space-y-6 flex-1">
                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Cardholder Name</label>
                          <input
                            type="text"
                            placeholder="John Doe"
                            value={cardDetails.name}
                            onChange={(e) => setCardDetails({ ...cardDetails, name: e.target.value })}
                            className="w-full h-14 rounded-2xl bg-white/5 border border-white/10 px-6 text-sm font-bold text-white outline-none focus:border-[#408c8c]"
                          />
                        </div>

                        <div className="space-y-2">
                          <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Card Number</label>
                          <input
                            type="text"
                            placeholder="**** **** **** ****"
                            maxLength={16}
                            value={cardDetails.number}
                            onChange={(e) => {
                              const val = e.target.value.replace(/\D/g, '');
                              setCardDetails({ ...cardDetails, number: val });
                              if (val.length > 0 && val.length < 16) {
                                setCardErrors(prev => ({ ...prev, number: "Must be 16 digits" }));
                              } else {
                                setCardErrors(prev => ({ ...prev, number: "" }));
                              }
                            }}
                            className={cn(
                              "w-full h-14 rounded-2xl bg-white/5 border px-6 text-sm font-bold text-white outline-none transition-all",
                              cardErrors.number ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10 focus:border-[#408c8c]"
                            )}
                          />
                          {cardErrors.number && <p className="text-[9px] font-bold text-red-500 pl-2 uppercase tracking-widest">{cardErrors.number}</p>}
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">Expiry Date</label>
                            <input
                              type="text"
                              placeholder="MM / YY"
                              maxLength={7}
                              value={cardDetails.expiry}
                              onChange={(e) => {
                                let val = e.target.value;
                                if (val.length === 2 && !val.includes('/')) val += ' / ';
                                setCardDetails({ ...cardDetails, expiry: val });
                                setCardErrors(prev => ({ ...prev, expiry: "" }));
                              }}
                              onBlur={() => {
                                const expiryRegex = /^(0[1-9]|1[0-2])\s*\/\s*([2-9][0-9])$/;
                                const match = cardDetails.expiry.match(expiryRegex);
                                if (cardDetails.expiry && !match) {
                                  setCardErrors(prev => ({ ...prev, expiry: "Invalid format (MM / YY)" }));
                                } else if (match) {
                                  const month = parseInt(match[1]);
                                  const year = parseInt("20" + match[2]);
                                  const now = new Date();
                                  if (year < now.getFullYear() || (year === now.getFullYear() && month < (now.getMonth() + 1))) {
                                    setCardErrors(prev => ({ ...prev, expiry: "Date is in the past" }));
                                  }
                                }
                              }}
                              className={cn(
                                "w-full h-14 rounded-2xl bg-white/5 border px-6 text-sm font-bold text-white outline-none transition-all",
                                cardErrors.expiry ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10 focus:border-[#408c8c]"
                              )}
                            />
                            {cardErrors.expiry && <p className="text-[9px] font-bold text-red-500 pl-2 uppercase tracking-widest">{cardErrors.expiry}</p>}
                          </div>
                          <div className="space-y-2">
                            <label className="text-[9px] font-black uppercase text-slate-500 tracking-[0.2em] pl-1">CVV</label>
                            <input
                              type="password"
                              placeholder="***"
                              maxLength={3}
                              value={cardDetails.cvv}
                              onChange={(e) => {
                                const val = e.target.value.replace(/\D/g, '');
                                setCardDetails({ ...cardDetails, cvv: val });
                                if (val.length > 0 && val.length < 3) {
                                  setCardErrors(prev => ({ ...prev, cvv: "Must be 3 digits" }));
                                } else {
                                  setCardErrors(prev => ({ ...prev, cvv: "" }));
                                }
                              }}
                              className={cn(
                                "w-full h-14 rounded-2xl bg-white/5 border px-6 text-sm font-bold text-white outline-none transition-all",
                                cardErrors.cvv ? "border-red-500 shadow-[0_0_10px_rgba(239,68,68,0.2)]" : "border-white/10 focus:border-[#408c8c]"
                              )}
                            />
                            {cardErrors.cvv && <p className="text-[9px] font-bold text-red-500 pl-2 uppercase tracking-widest">{cardErrors.cvv}</p>}
                          </div>
                        </div>
                      </div>

                      <Button
                        onClick={handleOrderSubmit}
                        disabled={isSubmitting || !cardDetails.number || !cardDetails.expiry || !cardDetails.cvv || !cardDetails.name}
                        className="w-full h-18 bg-[#408c8c] hover:bg-[#408c8c]/90 text-white rounded-[1.5rem] font-black uppercase italic tracking-[0.1em] text-base shadow-xl shadow-[#408c8c]/20 flex items-center justify-center gap-4 transition-all active:scale-95 disabled:opacity-30 mt-8"
                      >
                        {isSubmitting ? (
                          <div className="animate-spin h-6 w-6 border-4 border-white border-t-transparent rounded-full" />
                        ) : (
                          <>Pay & Place Order <ArrowRight className="w-5 h-5" /></>
                        )}
                      </Button>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      )}
      <Footer />

      <InvoiceSuccessDialog
        open={showInvoiceDialog}
        onOpenChange={setShowInvoiceDialog}
        order={createdOrder}
        tableInfo={tables.find(t => t._id === selectedTable)}
        staffInfo={null} // Customer order
        resetForm={() => {
          setCart([]);
          setOrderNote("");
          setSelectedTable("");
          setPaymentMethod("");
          setCardDetails({ number: '', expiry: '', cvv: '', name: '' });
          setCheckoutStep('FORM');
        }}
      />
    </div>
  );
}

export default function RootPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[#0F0E28]">
        <div className="animate-spin h-10 w-10 border-4 border-[#408c8c] border-t-transparent rounded-full" />
      </div>
    }>
      <RootPageContent />
    </Suspense>
  );
}
