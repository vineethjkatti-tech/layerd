import React, { useState, useEffect } from 'react';
import { supabase } from '/supabase';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line
} from 'recharts';
import {
  LayoutDashboard, ShoppingCart, BarChart2, Settings, Search,
  MoreVertical, Copy, Phone, Package, Truck, CheckCircle,
  Clock, XCircle, ChevronRight, LogIn, ExternalLink, Filter
} from 'lucide-react';
import { format, startOfDay, subDays, isWithinInterval } from 'date-fns';

const OrderStatus = {
  PAID: 'paid',
  PRINTING: 'printing',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
};

const StatusColors = {
  [OrderStatus.PAID]: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  [OrderStatus.PRINTING]: 'bg-brand-purple/20 text-brand-purple border-brand-purple/30',
  [OrderStatus.PACKED]: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  [OrderStatus.SHIPPED]: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  [OrderStatus.DELIVERED]: 'bg-green-500/20 text-green-400 border-green-500/30',
  [OrderStatus.CANCELLED]: 'bg-red-500/20 text-red-400 border-red-500/30',
};

const App = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [activeTab, setActiveTab] = useState('orders'); // Main view default
  const [orders, setOrders] = useState([]);
  const [stats, setStats] = useState({ total: 0, revenue: 0, todayOrders: 0, todayRevenue: 0 });
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [analyticsData, setAnalyticsData] = useState([]);

  // Mock login for owner - in real use, would use Supabase Auth
  const handleLogin = (e) => {
    e.preventDefault();
    if (email === 'admin@layerd.studio' && password === 'layered2026') {
      setIsAuthenticated(true);
      fetchOrders();
    } else {
      alert('Unauthorized access attempt logged.');
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setOrders(data || []);
      calculateStats(data || []);
      generateAnalytics(data || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  };

  const calculateStats = (data) => {
    const today = startOfDay(new Date());
    const total = data.length;
    const revenue = data.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

    const todayData = data.filter(d => startOfDay(new Date(d.created_at)).getTime() === today.getTime());
    const todayOrders = todayData.length;
    const todayRevenue = todayData.reduce((acc, curr) => acc + (parseFloat(curr.price) || 0), 0);

    setStats({ total, revenue, todayOrders, todayRevenue });
  };

  const generateAnalytics = (data) => {
    const last30Days = Array.from({ length: 30 }, (_, i) => {
      const date = subDays(new Date(), i);
      return {
        date: format(date, 'MMM dd'),
        fullDate: startOfDay(date),
        sales: 0,
        orders: 0
      };
    }).reverse();

    data.forEach(order => {
      const orderDate = startOfDay(new Date(order.created_at));
      const dayData = last30Days.find(d => d.fullDate.getTime() === orderDate.getTime());
      if (dayData) {
        dayData.sales += (parseFloat(order.price) || 0);
        dayData.orders += 1;
      }
    });

    setAnalyticsData(last30Days);
  };

  const updateOrderStatus = async (id, status) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status })
        .eq('id', id);

      if (error) throw error;
      setOrders(orders.map(o => o.id === id ? { ...o, status } : o));
    } catch (err) {
      console.error('Update failed:', err);
    }
  };

  const updateShipping = async (id, tracking_id, courier) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ tracking_id, courier, status: OrderStatus.SHIPPED })
        .eq('id', id);

      if (error) throw error;
      setOrders(orders.map(o => o.id === id ? { ...o, tracking_id, courier, status: OrderStatus.SHIPPED } : o));
    } catch (err) {
      console.error('Shipping update failed:', err);
    }
  };

  const filteredOrders = orders.filter(order => {
    const matchesSearch =
      order.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      order.order_code?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus = statusFilter === 'all' || order.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-brand-black px-6">
        <div className="max-w-md w-full glass-card p-10 border-white/5 shadow-2xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl font-bold tracking-tighter text-white mb-2">LYRD</h1>
            <p className="text-brand-gray text-[10px] uppercase tracking-widest font-bold">Studio Operations Dashboard</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-brand-gray font-bold mb-2">Admin Identity</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-purple/40 transition-colors"
                placeholder="studio@layerd.prints"
              />
            </div>
            <div>
              <label className="block text-[10px] uppercase tracking-widest text-brand-gray font-bold mb-2">Secure Key</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-white/[0.03] border border-white/10 rounded-xl px-4 py-4 text-white focus:outline-none focus:border-brand-purple/40 transition-colors"
                placeholder="••••••••"
              />
            </div>
            <button className="w-full bg-brand-purple text-black font-bold py-4 rounded-xl hover:bg-white transition-all flex items-center justify-center gap-2">
              <LogIn size={18} />
              Access Dashboard
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-black flex text-white font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/5 flex flex-col pt-8 bg-[#0D0D0D]">
        <div className="px-8 mb-12">
          <h2 className="text-2xl font-bold tracking-tighter">LYRD<span className="text-brand-purple">.</span></h2>
          <p className="text-[10px] text-brand-gray font-bold uppercase tracking-widest mt-1">Admin Panel</p>
        </div>

        <nav className="flex-grow space-y-1">
          {[
            { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
            { id: 'orders', label: 'Orders', icon: ShoppingCart },
            { id: 'analytics', label: 'Analytics', icon: BarChart2 },
            { id: 'settings', label: 'Settings', icon: Settings },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-4 px-8 py-4 transition-all ${activeTab === item.id
                  ? 'bg-brand-purple/5 text-brand-purple border-r-2 border-brand-purple'
                  : 'text-brand-gray hover:text-white hover:bg-white/5'
                }`}
            >
              <item.icon size={20} />
              <span className="font-medium">{item.label}</span>
            </button>
          ))}
        </nav>

        <div className="p-8 border-t border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-brand-purple flex items-center justify-center text-black font-bold text-xs shadow-[0_0_15px_rgba(155,135,245,0.4)]">LA</div>
            <div>
              <p className="text-xs font-bold">Studio Owner</p>
              <button
                onClick={() => setIsAuthenticated(false)}
                className="text-[10px] text-brand-gray hover:text-red-400 font-bold uppercase tracking-widest transition-colors"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-grow overflow-y-auto">
        <header className="h-20 border-b border-white/5 flex items-center justify-between px-10 sticky top-0 bg-brand-black/80 backdrop-blur-xl z-50">
          <h2 className="text-xl font-bold uppercase tracking-widest text-white/90">
            {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
          </h2>
          <div className="flex items-center gap-4">
            <div className="relative group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-brand-gray group-focus-within:text-brand-purple transition-colors" size={18} />
              <input
                type="text"
                placeholder="Search orders, code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-full pl-12 pr-6 py-2 text-sm focus:outline-none focus:border-brand-purple/40 transition-all w-80"
              />
            </div>
            <button onClick={fetchOrders} className="p-2 hover:bg-white/5 rounded-full text-brand-gray hover:text-brand-purple transition-all">
              <Clock size={20} />
            </button>
          </div>
        </header>

        <div className="p-10">
          {activeTab === 'dashboard' && (
            <div className="space-y-10">
              {/* Analytics Summary */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Orders", value: stats.total, icon: ShoppingCart },
                  { label: "Total Revenue", value: `₹${stats.revenue.toLocaleString()}`, icon: BarChart2 },
                  { label: "Orders Today", value: stats.todayOrders, icon: Clock },
                  { label: "Revenue Today", value: `₹${stats.todayRevenue.toLocaleString()}`, icon: CheckCircle }
                ].map((stat, i) => (
                  <div key={i} className="glass-card p-8 border-white/5 hover:border-brand-purple/20 transition-all group">
                    <div className="flex justify-between items-start mb-4 text-brand-gray group-hover:text-brand-purple transition-colors">
                      <stat.icon size={22} />
                      <span className="text-[10px] font-bold uppercase tracking-widest text-[#555]">Static</span>
                    </div>
                    <p className="text-3xl font-bold text-white mb-1">{stat.value}</p>
                    <p className="text-[10px] text-brand-gray font-bold uppercase tracking-[0.2em]">{stat.label}</p>
                  </div>
                ))}
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="glass-card p-8 min-h-[400px]">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-8 text-white/60 flex items-center gap-2">
                    <BarChart2 size={16} className="text-brand-purple" />
                    Daily Sales (Last 30 Days)
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="date" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: '12px' }}
                          itemStyle={{ color: '#9B87F5' }}
                        />
                        <Bar dataKey="sales" fill="#9B87F5" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
                <div className="glass-card p-8 min-h-[400px]">
                  <h3 className="text-sm font-bold uppercase tracking-widest mb-8 text-white/60 flex items-center gap-2">
                    <ShoppingCart size={16} className="text-brand-purple" />
                    Orders Velocity
                  </h3>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={analyticsData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
                        <XAxis dataKey="date" stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <YAxis stroke="#444" fontSize={10} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{ background: '#0D0D0D', border: '1px solid #222', borderRadius: '12px' }}
                          itemStyle={{ color: '#9B87F5' }}
                        />
                        <Line type="monotone" dataKey="orders" stroke="#9B87F5" strokeWidth={3} dot={{ fill: '#0A0A0A', stroke: '#9B87F5', strokeWidth: 2, r: 4 }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'orders' && (
            <div className="space-y-8">
              {/* Filters Header */}
              <div className="flex flex-wrap items-center justify-between gap-6 glass-card p-6">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-2 text-brand-gray">
                    <Filter size={16} />
                    <span className="text-[10px] font-bold uppercase tracking-widest">Filters</span>
                  </div>
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs focus:outline-none focus:border-brand-purple/40 text-white"
                  >
                    <option value="all" className="bg-brand-black">All Status</option>
                    {Object.values(OrderStatus).map(status => (
                      <option key={status} value={status} className="bg-brand-black">{status.toUpperCase()}</option>
                    ))}
                  </select>
                </div>
                <p className="text-[10px] font-bold text-brand-gray uppercase tracking-widest">
                  Showing <span className="text-white">{filteredOrders.length}</span> Results
                </p>
              </div>

              {/* Table Container */}
              <div className="glass-card border-none overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead>
                      <tr className="border-b border-white/5 bg-white/[0.02]">
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#555]">Order</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#555]">Customer</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#555]">Product</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#555]">Total</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#555]">Status</th>
                        <th className="px-8 py-5 text-[10px] font-bold uppercase tracking-widest text-[#555]">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                      {filteredOrders.length > 0 ? filteredOrders.map((order) => (
                        <tr key={order.id} className="hover:bg-white/[0.01] transition-colors group">
                          <td className="px-8 py-6">
                            <span className="text-sm font-bold block mb-1">#{order.order_code || 'N/A'}</span>
                            <span className="text-[9px] text-brand-gray/40 font-mono tracking-tighter uppercase">{format(new Date(order.created_at), 'MMM dd, HH:mm')}</span>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium text-white group-hover:text-brand-purple transition-colors">{order.name}</span>
                              <span className="text-[10px] text-brand-gray lowercase">{order.email}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-sm font-medium">{order.product}</span>
                              <span className="text-[10px] text-brand-gray/60 uppercase tracking-widest">Qty: {order.quantity || 1}</span>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-bold text-brand-purple">
                            ₹{(parseFloat(order.price) || 0).toLocaleString()}
                          </td>
                          <td className="px-8 py-6">
                            <select
                              value={order.status || OrderStatus.PAID}
                              onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                              className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-widest border focus:outline-none transition-all cursor-pointer ${StatusColors[order.status || OrderStatus.PAID]}`}
                            >
                              {Object.values(OrderStatus).map(status => (
                                <option key={status} value={status} className="bg-brand-black text-white">{status}</option>
                              ))}
                            </select>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <button
                                onClick={() => navigator.clipboard.writeText(order.address)}
                                className="p-2 bg-white/5 rounded-lg text-brand-gray hover:text-white transition-all group/btn flex items-center gap-2"
                                title="Copy Address"
                              >
                                <Copy size={12} />
                              </button>
                              <button
                                onClick={() => {
                                  const tid = prompt("Enter Tracking ID", order.tracking_id || "");
                                  const cr = prompt("Enter Courier Name", order.courier || "");
                                  if (tid && cr) updateShipping(order.id, tid, cr);
                                }}
                                className="px-4 py-2 bg-brand-purple/10 border border-brand-purple/20 rounded-lg text-brand-purple text-[10px] font-bold uppercase tracking-widest hover:bg-brand-purple hover:text-black transition-all"
                              >
                                Ship Order
                              </button>
                            </div>
                          </td>
                        </tr>
                      )) : (
                        <tr>
                          <td colSpan="6" className="px-8 py-20 text-center">
                            <p className="text-brand-gray/40 text-[10px] uppercase tracking-[0.4em] font-bold italic">No data found in studio ledger...</p>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {(activeTab === 'analytics' || activeTab === 'settings') && (
            <div className="flex flex-col items-center justify-center min-h-[400px] text-brand-gray border border-white/5 rounded-3xl opacity-50 bg-white/[0.01]">
              <Package size={48} className="mb-4" />
              <h3 className="text-sm font-bold uppercase tracking-widest">Section under Additive Construction</h3>
              <p className="text-[10px] mt-2">Check back soon for expanded studio tools.</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
