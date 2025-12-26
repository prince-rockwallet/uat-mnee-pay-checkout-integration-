"use client";

import { useState, useEffect } from "react";
import { 
  Play, 
  Pause, 
  Trash2, 
  Activity, 
  CheckCircle2, 
  Loader2, 
  ShoppingCart, 
  Package, 
  CreditCard, 
  User, 
  Clock,
  ExternalLink
} from "lucide-react";

interface LogItem {
  productId: string;
  productName: string;
  quantity: number;
  totalCents: number;
  selectedOptions?: Record<string, string>;
}

interface LogOrder {
  items: LogItem[];
  totalCents: number;
}

interface LogPayment {
  chain: string;
  stablecoin: string;
  paymentTxHash?: string;
  amountUsdCents?: number;
  type?: string;
}

interface LogData {
  event: "INTENT" | "PROCESSING" | "SUCCESS";
  sessionId: string;
  transactionId?: string;
  message?: string;
  order?: LogOrder;
  customer?: {
    email?: string;
    phone?: string;
  };
  payment?: LogPayment; 
  data?: LogPayment;
}

interface WebhookLog {
  id: string;
  receivedAt: string;
  data: LogData;
}

export default function WebhookPage() {
  const [logs, setLogs] = useState<WebhookLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [isLive, setIsLive] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await fetch("/api/mnee-pay-webhook");
      if (res.ok) {
        const json = await res.json();
        setLogs(json.logs);
      }
    } catch (error) {
      console.error("Failed to fetch logs:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  useEffect(() => {
    let intervalId: NodeJS.Timeout;

    if (isLive) {
      fetchLogs();
      intervalId = setInterval(fetchLogs, 2000);
    }

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [isLive]);

  return (
    <div className="flex flex-col items-center py-12 px-4 sm:px-6 lg:px-8 min-h-screen bg-linear-to-b from-amber-50 via-orange-50 to-yellow-50 text-orange-900">
      <main className="w-full max-w-4xl space-y-8">
        
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-extrabold tracking-tight text-orange-800">
            Webhook Inspector
          </h1>
          <p className="text-orange-700/80">
            Send POST requests to:{" "}
            <code className="bg-amber-100 border border-amber-300 px-2 py-1 rounded text-sm font-mono text-orange-900 shadow-xs">
              /api/mnee-pay-webhook
            </code>
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-between items-center bg-white/60 backdrop-blur-sm p-4 rounded-xl shadow-sm border border-amber-200 gap-4 sticky top-4 z-20">
          <div className="flex items-center gap-3 bg-amber-100 px-4 py-2 rounded-lg border border-amber-200">
            <span className="relative flex h-3 w-3">
              {isLive && (
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              )}
              <span
                className={`relative inline-flex rounded-full h-3 w-3 ${
                  isLive
                    ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]"
                    : "bg-red-500"
                }`}
              ></span>
            </span>
            <span
              className={`text-sm font-medium ${
                isLive ? "text-emerald-700" : "text-orange-700/60"
              }`}
            >
              {isLive ? "Live Listening" : "Paused"}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsLive(!isLive)}
              className={`flex items-center gap-2 text-sm font-semibold px-4 py-2 rounded-lg transition-all duration-200 border ${
                isLive
                  ? "bg-white border-amber-200 text-orange-900 hover:bg-amber-50"
                  : "bg-emerald-600 border-emerald-500 text-white hover:bg-emerald-500 shadow-md"
              }`}
            >
              {isLive ? (
                <>
                  <Pause className="w-4 h-4" /> Pause
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" /> Go Live
                </>
              )}
            </button>

            <div className="w-px h-6 bg-amber-300/50 mx-2"></div>

            <button
              onClick={() => setLogs([])}
              className="flex items-center gap-2 text-sm text-rose-600 hover:text-rose-700 font-medium px-4 py-2 hover:bg-rose-50 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Clear Logs
            </button>
          </div>
        </div>

        <div className="space-y-4">
          {loading ? (
            <>
              <LoadingSkeleton />
              <LoadingSkeleton />
            </>
          ) : logs.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 border-2 border-dashed border-amber-300/50 bg-amber-50/50 rounded-xl">
              <div className="w-16 h-16 bg-amber-100 rounded-full flex items-center justify-center mb-4">
                <Activity className="w-8 h-8 text-orange-400" />
              </div>
              <p className="text-orange-800 font-medium text-lg">
                No events received
              </p>
              <p className="text-orange-600/70 text-sm mt-1">
                Trigger a checkout flow to see data here.
              </p>
            </div>
          ) : (
            logs.map((log) => <WebhookLogCard key={log.id} log={log} />)
          )}
        </div>
      </main>
    </div>
  );
}


function WebhookLogCard({ log }: { log: WebhookLog }) {
  const { event, message, order, customer, sessionId, transactionId } = log.data;
  
  const paymentData = log.data.payment || log.data.data; 

  const getEventStyles = () => {
    switch (event) {
      case "SUCCESS":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-600" />,
          bg: "bg-emerald-50",
          border: "border-emerald-200",
          text: "text-emerald-800",
          badge: "bg-emerald-100 text-emerald-700 border-emerald-200"
        };
      case "PROCESSING":
        return {
          icon: <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />,
          bg: "bg-blue-50",
          border: "border-blue-200",
          text: "text-blue-800",
          badge: "bg-blue-100 text-blue-700 border-blue-200"
        };
      case "INTENT":
      default:
        return {
          icon: <ShoppingCart className="w-5 h-5 text-amber-600" />,
          bg: "bg-amber-50",
          border: "border-amber-200",
          text: "text-amber-800",
          badge: "bg-amber-100 text-amber-700 border-amber-200"
        };
    }
  };

  const style = getEventStyles();

  return (
    <div className={`rounded-xl shadow-sm border overflow-hidden transition-all hover:shadow-md ${style.bg} ${style.border}`}>
      
      <div className="px-5 py-3 border-b border-black/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border flex items-center gap-2 uppercase tracking-wider ${style.badge}`}>
            {style.icon}
            {event}
          </div>
          <span className="text-xs font-mono text-gray-500 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {new Date(log.receivedAt).toLocaleTimeString()}
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs font-mono text-gray-400">
           ID: <span className="text-gray-600 select-all">{log.id.slice(-8)}</span>
        </div>
      </div>

      <div className="p-5 space-y-6">
        
        {message && (
          <div className="text-sm font-medium text-gray-700 bg-white/50 p-3 rounded-lg border border-black/5">
            &quot;{message}&quot;
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {order && (
            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <Package className="w-3 h-3" /> Order Details
              </h4>
              <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-xs space-y-3">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between items-start text-sm group">
                    <div>
                      <span className="font-semibold text-gray-800">{item.productName}</span>
                      <div className="text-gray-500 text-xs mt-0.5">
                        Qty: {item.quantity} 
                        {item.selectedOptions && (
                          <span className="ml-2 px-1.5 py-0.5 bg-gray-100 rounded text-xs">
                             {Object.values(item.selectedOptions).join(", ")}
                          </span>
                        )}
                      </div>
                    </div>
                    <span className="font-mono text-gray-700">
                      ${(item.totalCents / 100).toFixed(2)}
                    </span>
                  </div>
                ))}
                <div className="border-t border-gray-100 pt-2 flex justify-between items-center text-sm font-bold text-gray-900">
                  <span>Total</span>
                  <span>${(order.totalCents / 100).toFixed(2)}</span>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            
            {paymentData && (
               <div className="space-y-3">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                  <CreditCard className="w-3 h-3" /> Payment
                </h4>
                <div className="bg-white rounded-lg border border-gray-100 p-3 shadow-xs text-sm space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Chain</span>
                    <span className="font-medium text-gray-800">{paymentData.chain || "N/A"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-500">Token</span>
                    <span className="font-medium text-gray-800">{paymentData.stablecoin || "N/A"}</span>
                  </div>
                  {paymentData.paymentTxHash && (
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-gray-500">Tx Hash</span>
                      <a href="#" className="flex items-center gap-1 text-blue-600 hover:text-blue-800 text-xs font-mono">
                        {paymentData.paymentTxHash.slice(0, 6)}...{paymentData.paymentTxHash.slice(-4)}
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="space-y-3">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                <User className="w-3 h-3" /> Context
              </h4>
              <div className="bg-white/60 rounded-lg p-3 text-xs space-y-2 border border-black/5">
                {customer?.email && (
                   <div className="flex gap-2">
                     <span className="text-gray-500 min-w-15">Email:</span>
                     <span className="text-gray-800 font-medium truncate">{customer.email}</span>
                   </div>
                )}
                <div className="flex gap-2 items-center">
                  <span className="text-gray-500 min-w-15">Session:</span>
                  <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 truncate flex-1">
                    {sessionId}
                  </code>
                </div>
                {transactionId && (
                  <div className="flex gap-2 items-center">
                    <span className="text-gray-500 min-w-15">Trans ID:</span>
                    <code className="bg-gray-100 px-1 py-0.5 rounded text-gray-600 truncate flex-1">
                      {transactionId}
                    </code>
                  </div>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="w-full h-48 bg-white/40 rounded-xl border border-amber-100 p-6 space-y-4 animate-pulse">
      <div className="flex justify-between">
        <div className="h-6 bg-amber-200/50 rounded w-24"></div>
        <div className="h-4 bg-amber-200/30 rounded w-16"></div>
      </div>
      <div className="grid grid-cols-2 gap-8 mt-4">
         <div className="space-y-2">
            <div className="h-4 bg-amber-200/20 rounded w-full"></div>
            <div className="h-4 bg-amber-200/20 rounded w-3/4"></div>
         </div>
         <div className="space-y-2">
            <div className="h-4 bg-amber-200/20 rounded w-full"></div>
            <div className="h-4 bg-amber-200/20 rounded w-1/2"></div>
         </div>
      </div>
    </div>
  );
}