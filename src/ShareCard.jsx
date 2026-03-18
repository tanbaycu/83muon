import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { motion } from 'framer-motion';
import anime from 'animejs';
import { Loader2, ArrowLeft, Link as LinkIcon, CheckCircle2, QrCode, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const defaultWish = "Chúc bạn một ngày 8/3 thật ý nghĩa, xinh đẹp và luôn hạnh phúc!";
// --- COMPONENT: Messy Path Drawing Loading ---
const LoadingSVG = () => {
  const [svgContent, setSvgContent] = useState('');
  const svgRef = useRef(null);

  useEffect(() => {
    fetch('/loadingv1.svg')
      .then(res => res.text())
      .then(text => setSvgContent(text))
      .catch(err => console.error('Error fetching SVG:', err));
  }, []);

  useEffect(() => {
    if (svgContent && svgRef.current) {
      const paths = svgRef.current.querySelectorAll('path');
      paths.forEach(p => {
        p.setAttribute('stroke', '#000000'); 
        p.setAttribute('stroke-width', '8'); 
        p.setAttribute('fill', 'transparent'); 
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
      });
      
      anime.timeline()
        .add({
          targets: paths,
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 4500,
          delay: function(el, i) { return i * 150 },
        })
        .add({
          targets: paths,
          fill: ['transparent', '#000000'],
          strokeWidth: ['8', '1.5'],
          duration: 1000,
          easing: 'easeInQuad'
        }, '-=800'); 
    }
  }, [svgContent]);

  return (
    <div 
      ref={svgRef} 
      className="w-[200px] h-[200px] md:w-[300px] md:h-[300px] opacity-90 drop-shadow-md flex items-center justify-center pointer-events-none" 
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};

export default function ShareCard() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [girlData, setGirlData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeMobileCard, setActiveMobileCard] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      if (!id) {
        setError("Không cung cấp mã định danh hợp lệ.");
        setIsLoading(false);
        return;
      }
      try {
        const docRef = doc(db, 'girls', id);
        const docSnap = await getDoc(docRef);
        
        if (docSnap.exists()) {
          setGirlData({ stt: id, ...docSnap.data() });
        } else {
          setError("Tấm thiệp này không tồn tại hoặc đã bị xóa.");
        }
      } catch (err) {
        console.error(err);
        setError("Lỗi kết nối máy chủ. Vui lòng thử lại sau.");
      }
      setIsLoading(false);
    };

    fetchData();
  }, [id]);

  const hashCode = useMemo(() => {
    if(!girlData) return 'A000';
    let hash = 0;
    const str = girlData.name + girlData.stt;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    return Math.abs(hash).toString(16).toUpperCase().substring(0, 5);
  }, [girlData]);

  const shareUrl = window.location.href;

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied('link');
    setTimeout(() => setCopied(false), 3000);
  };

  const handleShare = async () => {
    if (navigator.share) {
        try {
            await navigator.share({
                title: 'Kỷ Niệm 12A4 - Bức thư tuyệt mật',
                text: `Bạn nhận được một thông điệp từ ID #83-${girlData?.stt}`,
                url: shareUrl,
            });
        } catch (err) {
            console.log('Lỗi chia sẻ', err);
        }
    } else {
        handleCopyLink();
    }
  };

  const decodeHtmlEntities = (text) => {
     if(!text) return "";
     const textarea = document.createElement("textarea");
     textarea.innerHTML = text;
     return textarea.value;
  };

  const handleToggleCard = () => {
      const willOpen = !isOpen;
      setIsOpen(willOpen);

      const isMobile = window.innerWidth <= 768;

      anime.remove('.door-left');
      anime.remove('.door-right');
      anime.remove('.content-panel');
      anime.remove('.card-container');

      const tl = anime.timeline({
          easing: willOpen ? 'easeOutQuart' : 'easeOutCubic',
          duration: willOpen ? 1600 : 1200
      });

      if (willOpen) {
          tl.add({
              targets: '.card-container',
              scale: isMobile ? 0.75 : 1, 
          }, 0)
          .add({
              targets: '.door-left',
              // Góc nghiêng đẩy ra phía sau để thấy toàn mặt thiệp, 140 độ giống bản mockup
              rotateY: isMobile ? -145 : -140, 
          }, 0)
          .add({
              targets: '.door-right',
              rotateY: isMobile ? 145 : 140,
          }, 0)
          .add({
              targets: '.content-panel',
              scale: [0.95, 1],
              opacity: [0.5, 1],
              boxShadow: ['0px 0px 0px rgba(0,0,0,0)', '0px 30px 60px rgba(0,0,0,0.15)']
          }, 150);
      } else {
          tl.add({
              targets: '.card-container',
              scale: 1,
          }, 0)
          .add({
              targets: '.door-left',
              rotateY: 0,
          }, 0)
          .add({
              targets: '.door-right',
              rotateY: 0,
          }, 0)
          .add({
              targets: '.content-panel',
              scale: [1, 0.95],
              opacity: [1, 0.5],
              boxShadow: ['0px 30px 60px rgba(0,0,0,0.15)', '0px 0px 0px rgba(0,0,0,0)']
          }, 0);
      }
  };


  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-[#faf8f5] flex flex-col items-center justify-center font-sans-editorial select-none">
         <LoadingSVG />
         <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} delay={0.5} className="font-sans-editorial uppercase tracking-[0.4em] text-[10px] md:text-sm text-[#1c1a19]/80 flex items-center font-bold mt-6">
           DECODING MEMORY ID <span className="flex gap-1 ml-2">
              <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
              <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
              <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
           </span>
         </motion.div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="fixed inset-0 bg-[#faf8f5] flex flex-col items-center justify-center font-sans-editorial text-[#1c1a19] px-6 text-center">
         <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center text-red-500 mb-6">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
         </div>
         <h1 className="text-2xl font-serif-editorial font-bold mb-2">Truy xuất thất bại</h1>
         <p className="text-[#1c1a19]/50 mb-8 max-w-sm">{error}</p>
         <button onClick={() => navigate("/")} className="px-6 py-3 bg-[#1c1a19] text-white text-xs font-bold uppercase tracking-widest rounded-xl hover:bg-[#34302e] transition-colors shadow-lg active:scale-95">
           Trở về Trang chủ
         </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] md:min-h-[100dvh] w-full relative font-sans-editorial bg-[#1c1a19] flex items-center justify-center overflow-hidden md:overflow-x-hidden p-0 md:p-10 pb-safe">
      
      {/* Background Animated iframe & Overlay */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-100">
         <iframe src="/animated1.html" className="w-full h-full border-none object-cover scale-[1.2]" title="Flowers Background" />
         <div className="absolute inset-0 bg-[#1c1a19]/50 backdrop-blur-[1px]"></div>
         <div className="absolute inset-0 bg-gradient-to-t from-[#1c1a19] via-transparent to-transparent pointer-events-none" />
      </div>

      {isOpen && (
          <div className="hidden md:block fixed inset-0 z-[5] cursor-pointer" onClick={handleToggleCard} />
      )}

      <button 
        onClick={() => navigate("/")}
        className="hidden md:flex fixed top-6 left-6 md:top-10 md:left-10 z-[60] text-white/50 hover:text-[#a65d57] transition-all p-3 bg-white/5 hover:bg-white/10 backdrop-blur-md rounded-full shadow-lg border border-white/10 group"
        title="Quay lại danh sách"
      >
        <ArrowLeft strokeWidth={1.5} size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* -------------- MOBILE LAYOUT: 3 SWIPEABLE CARDS -------------- */}
      <div className="md:hidden relative z-10 w-full h-[100dvh] flex flex-col justify-end pb-[15vh]">
          
          <div 
            className="w-full flex flex-row items-center overflow-x-auto snap-x snap-mandatory hide-scrollbar px-[5vw]"
            onScroll={(e) => {
               const scrollLeft = e.target.scrollLeft;
               const width = window.innerWidth * 0.9;
               const index = Math.round(scrollLeft / width);
               if (index !== activeMobileCard) setActiveMobileCard(index);
            }}
          >
              <div className="flex gap-4 items-center pl-[5vw] pr-[5vw]">
                  
                  {/* Card 1: Avatar */}
                  <div className="snap-center shrink-0 w-[90vw] h-[75vh] max-h-[600px] bg-gradient-to-br from-[#2a2624] to-[#1c1a19] rounded-3xl p-6 border border-[#a65d57]/20 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center justify-center relative overflow-hidden">
                     <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#a65d57]/10 blur-[50px] rounded-full pointer-events-none z-0" />
                     <div className="relative z-10 w-32 h-32 rounded-full border-[2px] border-[#a65d57]/60 shadow-[0_0_40px_rgba(166,93,87,0.3)] overflow-hidden mb-6 ring-4 ring-[#1c1a19]">
                         {girlData?.imageUrl ? (
                             <img src={girlData.imageUrl} alt={girlData.name} className="w-full h-full object-cover" />
                         ) : (
                             <div className="w-full h-full bg-white/5" />
                         )}
                     </div>
                     <h2 className="relative z-10 font-serif-editorial text-3xl text-[#faf8f5] font-bold text-center leading-tight mb-2">
                         {girlData?.name}
                     </h2>
                     <div className="relative z-10 font-sans-editorial text-[10px] tracking-[0.4em] uppercase text-[#a65d57] text-center font-bold">
                         ID: {girlData?.stt}
                     </div>
                  </div>

                  {/* Card 2: Wish */}
                  <div className="snap-center shrink-0 w-[90vw] h-[75vh] max-h-[600px] bg-gradient-to-br from-[#1c1a19] to-[#2a2624] border border-white/5 rounded-3xl p-5 md:p-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col relative">
                     <div className="w-full border-b border-white/10 pb-3 mb-4 flex justify-between items-end relative z-10">
                         <div>
                            <span className="font-sans-editorial text-[9px] uppercase tracking-[0.2em] font-bold text-[#a65d57]">Gửi tới</span>
                            <h2 className="font-serif-editorial text-[1.4rem] font-bold text-white leading-none mt-1">{girlData?.name}</h2>
                         </div>
                         <div className="font-mono text-[9px] text-white/40 tracking-widest text-right">
                            ID: {girlData?.stt}<br/>
                            <span className="opacity-50 text-[7px] font-bold">VERIFIED CA</span>
                         </div>
                     </div>
                     <div className="flex-1 overflow-y-auto custom-scrollbar font-serif-editorial text-base text-justify text-white/80 pr-1 relative">
                        <div className="fixed top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] text-[15rem] leading-none pointer-events-none font-serif-editorial select-none">"</div>
                        <ReactMarkdown 
                            remarkPlugins={[remarkGfm]}
                            components={{
                              p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                              strong: ({node, ...props}) => <strong className="font-bold text-[#a65d57]" {...props} />,
                              em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                            }}
                        >
                            {decodeHtmlEntities(girlData?.wish) || defaultWish}
                        </ReactMarkdown>
                        <div className="mt-6 text-right italic font-bold text-[#a65d57] text-lg pb-4">
                            — {girlData?.signature || 'Thanh Xuân 12A4'}
                        </div>
                     </div>
                  </div>

                  {/* Card 3: QR Code */}
                  <div className="snap-center shrink-0 w-[90vw] h-[75vh] max-h-[600px] bg-gradient-to-br from-[#1c1a19] to-[#2a2624] rounded-3xl p-6 border border-white/5 shadow-[0_20px_50px_rgba(0,0,0,0.6)] flex flex-col items-center justify-between text-white relative">
                     <span className="font-sans-editorial text-[10px] tracking-widest text-[#a65d57] uppercase">Kỷ Niệm 12A4</span>
                     <div className="flex flex-col items-center justify-center w-full flex-1">
                         <div className="text-white/40 italic font-serif-editorial text-xl mb-6 text-center">Scan to Capture</div>
                         <div className="group relative rounded-2xl shadow-xl hover:scale-105 transition-transform duration-500 mb-6 bg-transparent border-[0.5px] border-white/20 p-2">
                             <img src={`https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=400&light=ffffff&dark=1c1a19&margin=1`} alt="QR Code" className="w-[65vw] max-w-[240px] aspect-square object-contain rounded-xl mix-blend-screen opacity-90" />
                         </div>
                         <span className="font-mono text-[11px] text-white/30 tracking-[0.3em] uppercase mt-8 text-center">
                             #{hashCode}
                         </span>
                     </div>
                  </div>
                  
              </div>
          </div>
          
          {/* Pagination Indicators */}
          <div className="absolute bottom-28 left-0 w-full flex justify-center items-center gap-3">
              {[0, 1, 2].map((i) => (
                  <div key={i} className={`h-1.5 rounded-full transition-all duration-300 ${activeMobileCard === i ? 'w-6 bg-[#faf8f5]' : 'w-1.5 bg-white/30'}`} />
              ))}
          </div>
          
          <div className="absolute bottom-20 left-0 w-full flex justify-center gap-2 opacity-50 text-[9px] tracking-widest text-white uppercase items-center font-sans-editorial font-bold pointer-events-none">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
              <span>Vuốt Hai Bên</span> 
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
          </div>
      </div>

      {/* -------------- PC LAYOUT: GATEFOLD 3D CARD -------------- */}
      <div className="hidden md:flex card-perspective w-full h-full absolute inset-0 items-center justify-center [perspective:2500px] z-10 pointer-events-none">
          <div className="pointer-events-auto w-full h-full flex items-center justify-center">
              <div className="card-container relative md:max-w-none md:w-[950px] lg:w-[1200px] md:h-[600px] lg:h-[750px] mx-auto z-10 origin-center transition-all">
                  
                  {/* MẶT TRONG THIỆP (Nội dung) */}
                  <div className="content-panel absolute inset-0 bg-[#faf8f5] rounded-3xl flex flex-col p-6 md:p-10 opacity-60 scale-95 border border-[#1c1a19]/10 [transform-style:preserve-3d]">
                      <div className="w-full border-b border-[var(--color-rust)]/20 pb-4 mb-6 flex justify-between items-end relative z-10">
                          <div>
                             <span className="font-sans-editorial text-[9px] uppercase tracking-[0.2em] font-bold text-[#a65d57]">Gửi tới</span>
                             <h2 className="font-serif-editorial text-[1.8rem] md:text-4xl font-bold text-[#1c1a19] leading-none mt-1">{girlData?.name}</h2>
                          </div>
                          <div className="font-mono text-[10px] md:text-sm text-[#1c1a19]/40 tracking-widest text-right">
                             ID: {girlData?.stt}<br/>
                             <span className="opacity-50 text-[8px] md:text-[10px]">VERIFIED CA</span>
                          </div>
                      </div>
                      
                      <div className="flex-1 overflow-y-auto custom-scrollbar font-serif-editorial text-base md:text-lg text-justify text-[#1c1a19]/80 pr-4 relative">
                         <div className="fixed top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 opacity-[0.03] text-[20rem] leading-none pointer-events-none font-serif-editorial select-none">"</div>
                         
                         <ReactMarkdown 
                             remarkPlugins={[remarkGfm]}
                             components={{
                               p: ({node, ...props}) => <p className="mb-4 leading-relaxed" {...props} />,
                               strong: ({node, ...props}) => <strong className="font-bold text-[#a65d57]" {...props} />,
                               em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                             }}
                         >
                             {decodeHtmlEntities(girlData?.wish) || defaultWish}
                         </ReactMarkdown>

                         <div className="mt-8 text-right italic font-bold text-[#a65d57] text-xl md:text-2xl pb-4">
                             — {girlData?.signature || 'Nh?ng Ngu?i Ch�n Th�nh'}
                         </div>
                      </div>

                      {/* Click to Close Hint */}
                      <div className="absolute -bottom-12 left-1/2 -translate-x-1/2 text-[10px] uppercase tracking-widest text-[#faf8f5]/40 font-bold whitespace-nowrap animate-pulse pointer-events-none">
                          Chạm bên ngoài để đóng
                      </div>
                  </div>

                  {/* 2 CÁNH CỬA (Doors) */}
                  <div className="absolute inset-0 flex [transform-style:preserve-3d] shadow-[0_20px_50px_rgba(0,0,0,0.5)] rounded-3xl pointer-events-none">
                      
                       {/* LEFT DOOR */}
                      <div className="door-left relative w-1/2 h-full origin-left [transform-style:preserve-3d] z-20 cursor-pointer pointer-events-auto" onClick={handleToggleCard}>
                           
                           {/* Inside Left (Backface) */}
                           <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-br from-[#1c1a19] to-[#2a2624] rounded-l-3xl border-y border-l border-white/10 p-4 md:p-8 flex flex-col items-center justify-between text-white drop-shadow-2xl">
                               <span className="font-sans-editorial text-[8px] md:text-[10px] tracking-widest text-[#a65d57] uppercase">Hồi Ức 12A4</span>
                               <div className="flex flex-col items-center w-full">
                                   <div className="text-white/40 italic font-serif-editorial text-base md:text-xl mb-4 text-center">Scan to Capture</div>
                                   <div className="group relative rounded-2xl shadow-xl hover:scale-105 transition-transform duration-500 bg-transparent border-[0.5px] border-white/20 p-2 md:p-3">
                                       <img src={`https://quickchart.io/qr?text=${encodeURIComponent(shareUrl)}&size=500&light=ffffff&dark=1c1a19&margin=1`} alt="QR Code" className="w-40 h-40 lg:w-64 lg:h-64 object-contain rounded-xl mix-blend-screen opacity-90" />
                                   </div>
                                   <span className="font-mono text-[9px] md:text-[11px] text-white/30 tracking-[0.3em] uppercase mt-6 text-center">
                                       #{hashCode}
                                   </span>
                               </div>
                               <QrCode size={16} className="text-white/10" />
                           </div>

                           {/* Outside Left (Frontface) */}
                           <div className="absolute inset-0 [backface-visibility:hidden] rounded-l-3xl overflow-hidden bg-[#1c1a19] flex flex-col items-center justify-between p-6 md:p-10 border border-white/5 border-r-0 shadow-[inset_10px_0_20px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-[#a65d57]/10 via-transparent to-transparent z-0 pointer-events-none" />
                                <div className="w-full flex justify-start relative z-10">
                                    <span className="font-sans-editorial text-[7px] sm:text-[8px] md:text-[10px] tracking-[0.4em] uppercase text-[#faf8f5]/40 [writing-mode:vertical-rl] rotate-180">
                                        Kỷ Niệm • 12A4
                                    </span>
                                </div>
                                <div className="flex-1 flex items-center justify-center w-full relative z-10 pt-10">
                            <h2 className="font-serif-editorial text-[#faf8f5] text-[3.5rem] sm:text-5xl md:text-7xl italic opacity-90 -rotate-90 whitespace-nowrap drop-shadow-lg translate-y-12 sm:translate-y-0 text-center">
                                        Vol. {id.length === 1 ? `0${id}` : id}
                                    </h2>
                                </div>
                                <div className="w-full flex justify-end relative z-10">
                                     <div className="w-8 h-[1px] bg-[#a65d57]/50" />
                                </div>
                           </div>
                      </div>

                      {/* RIGHT DOOR */}
                      <div className="door-right relative w-1/2 h-full origin-right [transform-style:preserve-3d] z-20 cursor-pointer pointer-events-auto border-l-0" onClick={handleToggleCard}>
                           
                           {/* Inside Right (Backface) */}
                           <div className="absolute inset-0 [backface-visibility:hidden] [transform:rotateY(180deg)] bg-gradient-to-tr from-[#1c1a19] to-[#2a2624] rounded-r-3xl border-y border-r border-white/10 p-4 md:p-6 flex flex-col justify-end text-right drop-shadow-2xl overflow-hidden">
                               <div className="opacity-[0.02] text-[10rem] md:text-[15rem] font-serif-editorial absolute bottom-[-3rem] md:bottom-[-5rem] right-[-1rem] md:right-[-2rem] leading-none pointer-events-none">12A4</div>
                               <h3 className="font-serif-editorial text-[#a65d57] text-xl md:text-3xl lg:text-4xl italic">Thanh Xuân 12A4</h3>
                               <p className="font-sans-editorial text-[7px] md:text-[9px] lg:text-[11px] text-white/40 tracking-[0.3em] mt-2 uppercase">Góc Kỷ Niệm<br/>Class of 12A4</p>
                           </div>

                           {/* Outside Right (Frontface) */}
                           <div className="absolute inset-0 [backface-visibility:hidden] rounded-r-3xl overflow-hidden bg-[#1c1a19] flex flex-col items-center justify-center p-4 md:p-8 border border-white/5 border-l-0 shadow-[inset_-10px_0_20px_rgba(0,0,0,0.5)]">
                                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[150%] h-[150%] bg-[#a65d57]/10 blur-[50px] rounded-full pointer-events-none z-0" />
                                
                                <div className="relative z-10 w-24 h-24 md:w-36 md:h-36 rounded-full border-[1.5px] md:border-[2px] border-[#a65d57]/40 shadow-[0_0_40px_rgba(166,93,87,0.2)] overflow-hidden mb-6 group transition-all duration-700 hover:scale-[1.03] hover:border-[#a65d57]/80 ring-4 ring-[#1c1a19] hover:ring-[#a65d57]/20">
                                    {girlData?.imageUrl ? (
                                        <img src={girlData.imageUrl} alt={girlData.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                    ) : (
                                        <div className="w-full h-full bg-white/5" />
                                    )}
                                </div>
                                <h2 className="relative z-10 font-serif-editorial text-2xl md:text-3xl lg:text-4xl text-[#faf8f5] font-bold text-center leading-tight mb-2 drop-shadow-md">
                                    {girlData?.name}
                                </h2>
                                <div className="relative z-10 font-sans-editorial text-[7px] md:text-[10px] tracking-[0.4em] uppercase text-[#a65d57] text-center font-bold">
                                    ID: {girlData?.stt}
                                </div>
                           </div>
                      </div>

                  </div>
              </div>
          </div>
      </div>

      {/* Floating Action Bar */}
      <div className={`fixed bottom-6 md:bottom-10 left-0 w-full flex flex-row justify-center gap-3 md:gap-6 z-50 transition-all duration-700 ease-out px-4 ${activeMobileCard === 2 ? 'translate-y-0 opacity-100 pointer-events-auto' : 'translate-y-12 opacity-0 pointer-events-none'} ${isOpen ? 'md:translate-y-0 md:opacity-100 md:pointer-events-auto' : 'md:translate-y-12 md:opacity-0 md:pointer-events-none'}`}>
         <button onClick={handleCopyLink} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#1c1a19]/90 backdrop-blur-xl text-white rounded-full px-5 py-4 font-sans-editorial uppercase tracking-widest text-[10px] md:text-[11px] font-bold shadow-[0_10px_30px_rgba(0,0,0,0.5)] hover:bg-[#34302e] transition-all border border-white/10 active:scale-95">
             {copied === 'link' ? <CheckCircle2 size={16} className="text-green-400" /> : <LinkIcon size={16} />}
             {copied === 'link' ? 'Đã sao chép' : 'Sao chép Link'}
         </button>
         <button onClick={handleShare} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-[#a65d57]/90 backdrop-blur-xl text-white rounded-full px-5 py-4 font-sans-editorial uppercase tracking-widest text-[10px] md:text-[11px] font-bold shadow-[0_10px_30px_rgba(166,93,87,0.4)] hover:bg-[#8e4f4a] transition-all border border-white/10 active:scale-95">
             <Share2 size={16} />
             Chia Sẻ
         </button>
      </div>

      {/* Pulsing Hint for closed card (PC ONLY) */}
      <div className={`hidden md:block fixed bottom-12 left-1/2 -translate-x-1/2 text-[11px] uppercase tracking-[0.4em] text-white/50 font-bold pointer-events-none transition-all duration-500 ease-out z-[5] ${!isOpen ? 'opacity-100 animate-pulse' : 'opacity-0 translate-y-4'}`}>
          Click để mở
      </div>
    </div>
  );
}
