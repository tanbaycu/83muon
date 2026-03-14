import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import anime from 'animejs';
import { ArrowLeft, ChevronUp, QrCode } from 'lucide-react';
import { members, defaultWish } from './members';

// --- COMPONENT: Circular Text SVG for Mobile Bottom Sheet ---
const CircularText = ({ text }) => {
  return (
    <div className="relative w-28 h-28 md:w-32 md:h-32 animate-[spin_12s_linear_infinite] shrink-0">
      <svg viewBox="0 0 100 100" className="w-full h-full overflow-visible">
        <path id="circlePath" fill="none" d="M 50, 50 m -40, 0 a 40,40 0 0,1 80,0 a 40,40 0 0,1 -80,0" />
        <text className="text-[10.5px] font-sans-editorial tracking-[0.25em] uppercase fill-[var(--color-charcoal)]">
          <textPath href="#circlePath" startOffset="0%">{text}</textPath>
        </text>
      </svg>
    </div>
  );
};

// --- COMPONENT: Editorial Marquee ---
const EditorialMarquee = ({ direction = "left", text }) => {
  return (
    <div className="w-full overflow-hidden flex border-y border-[var(--color-charcoal)]/10 py-3 bg-[var(--color-oatmeal)] shrink-0">
      <div className={`flex items-center gap-8 text-[11px] md:text-sm font-sans-editorial uppercase tracking-[0.3em] text-[var(--color-charcoal)]/60 ${direction === 'left' ? 'animate-marquee-l' : 'animate-marquee-r'}`}>
        {Array(10).fill(0).map((_, i) => (
          <span key={i} className="flex items-center gap-8 whitespace-nowrap">
             {text} <span className="w-8 h-[1px] bg-[var(--color-charcoal)]/20" />
          </span>
        ))}
      </div>
    </div>
  );
};

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
        // Khôi phục mốc contrast đen thuần (#000000) và độ nét nét lên 8 để thấy rõ nhưng không dùng stroke-dasharray thủ công làm hỏng hình dáng chữ.
        p.setAttribute('stroke', '#000000'); 
        p.setAttribute('stroke-width', '8'); 
        p.setAttribute('fill', 'transparent'); 
        p.setAttribute('stroke-linecap', 'round');
        p.setAttribute('stroke-linejoin', 'round');
      });
      
      // Line drawing to Fill effect using AnimeJS timeline
      anime.timeline()
        .add({
          targets: paths,
          strokeDashoffset: [anime.setDashoffset, 0],
          easing: 'easeInOutSine',
          duration: 4500, // Gọn gàng mượt mà
          delay: function(el, i) { return i * 150 },
        })
        .add({
          targets: paths,
          fill: ['transparent', '#000000'],
          strokeWidth: ['8', '1.5'], // Fill màu và làm mỏng viền đi cho đẹp
          duration: 1000,
          easing: 'easeInQuad'
        }, '-=800'); 
    }
  }, [svgContent]);

  return (
    // Bỏ mix-blend-multiply để SVG không bị chìm vào nền
    <div 
      ref={svgRef} 
      className="w-[300px] h-[300px] md:w-[450px] md:h-[450px] opacity-90 drop-shadow-md flex items-center justify-center pointer-events-none" 
      dangerouslySetInnerHTML={{ __html: svgContent }} 
    />
  );
};

const App = () => {
  const [step, setStep] = useState(1);
  const [stt, setStt] = useState('');
  const [selectedGirl, setSelectedGirl] = useState(null);
  const [isInitiating, setIsInitiating] = useState(false);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [quoteOpen, setQuoteOpen] = useState(false); // Mobile UX state
  const inputRef = useRef(null);

  // Focus input automatically on mount
  useEffect(() => {
    if (step === 1 && inputRef.current) {
      inputRef.current.focus();
    }
  }, [step]);

  // Slideshow Logic for Frame 2
  useEffect(() => {
    if (step === 2 && selectedGirl?.images?.length > 1 && !quoteOpen) {
      const interval = setInterval(() => {
        setCurrentImageIndex((prev) => (prev + 1) % selectedGirl.images.length);
      }, 5000); 
      return () => clearInterval(interval);
    }
  }, [step, selectedGirl, quoteOpen]);

  const handleOpenCard = () => {
    const girl = members.find(m => m.stt === stt.padStart(2, '0'));
    
    if (girl) {
      setIsInitiating(true);
      setTimeout(() => {
        setCurrentImageIndex(0);
        setSelectedGirl(girl);
        setStep(2);
        setIsInitiating(false);
      }, 6000); // Điều chỉnh lại tgian xem intro
    } else {
      alert('Không tìm thấy tệp tài liệu cho mã định danh này.');
    }
  };

  // Mobile Swipe/Tap Controllers
  const nextImage = (e) => {
    e.stopPropagation();
    if (selectedGirl?.images?.length > 1) {
        setCurrentImageIndex(prev => (prev + 1) % selectedGirl.images.length);
    }
  };
  
  const prevImage = (e) => {
    e.stopPropagation();
    if (selectedGirl?.images?.length > 1) {
        setCurrentImageIndex(prev => (prev - 1 + selectedGirl.images.length) % selectedGirl.images.length);
    }
  };

  return (
    <div className="w-full h-full relative font-sans-editorial selection:bg-[var(--color-rust)] selection:text-white">
      
      {/* Absolute decorative vertical text */}
      <div className="fixed top-8 right-6 md:top-12 md:left-8 vertical-text text-[10px] md:text-sm font-bold tracking-[0.4em] uppercase text-[var(--color-charcoal)]/30 pointer-events-none z-[100] hidden md:block">
        PROJECT VENUS // KÝ SỰ BÍ MẬT // TỪ NHỮNG QUÝ ÔNG
      </div>

      <AnimatePresence mode="wait">
        {step === 1 ? (
          <motion.div
            key="frame1"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{ duration: 0.8 }}
            className="w-full h-[100dvh] flex flex-col justify-center z-10 bg-[var(--color-oatmeal)] overflow-hidden relative"
          >
            {/* Siêu hiệu ứng Loading Overlay */}
            <AnimatePresence>
              {isInitiating && (
                <motion.div 
                  initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  animate={{ opacity: 1, backdropFilter: 'blur(16px)' }}
                  exit={{ opacity: 0, backdropFilter: 'blur(0px)' }}
                  transition={{ duration: 0.8 }}
                  className="fixed inset-0 z-[200] bg-[var(--color-oatmeal)] flex flex-col justify-center items-center"
                >
                  <LoadingSVG />
                  <motion.div 
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5, duration: 1 }}
                    className="mt-6 font-sans-editorial uppercase tracking-[0.4em] text-[10px] md:text-sm text-[var(--color-charcoal)]/80 flex items-center relative z-10 font-bold"
                  >
                    DECODING <span className="flex gap-1 ml-2">
                      <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.2 }}>.</motion.span>
                      <motion.span animate={{ opacity: [0,1,0] }} transition={{ repeat: Infinity, duration: 1.5, delay: 0.4 }}>.</motion.span>
                    </span>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
            <div className="absolute top-0 left-0 w-full z-20">
              <EditorialMarquee direction="left" text="CHÚC MỪNG NGÀY QUỐC TẾ PHỤ NỮ 8/3" />
            </div>

            {/* Giant Background Typography */}
            <div className="absolute top-1/2 left-0 -translate-y-1/2 text-[18vw] md:text-[15vw] font-serif-editorial italic text-stroke-huge pointer-events-none whitespace-nowrap z-0 origin-left opacity-50">
              Mỹ nhân
            </div>

            <div className="w-full max-w-4xl relative z-10 mx-auto px-6 md:px-0 flex flex-col justify-center items-start pt-16 pb-16">
               
               <motion.h1 
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 1 }}
                  className="font-serif-editorial text-[2.5rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.2rem] leading-[1.3] md:leading-[1.15] text-[var(--color-charcoal)] text-left"
               >
                 Xin chào, <br />
                 tôi là đóa hoa mang <br className="hidden md:block" />
                 số thứ tự 
                 <span className="inline-block mx-3 md:mx-5">
                   <input 
                     ref={inputRef}
                     type="text" 
                     value={stt}
                     onChange={(e) => setStt(e.target.value)}
                     onKeyPress={(e) => e.key === 'Enter' && handleOpenCard()}
                     placeholder="XX"
                     maxLength={2}
                     className="bg-transparent border-b-[3px] border-[var(--color-charcoal)]/30 focus:border-[var(--color-rust)] outline-none text-center transition-colors w-[1.6em] md:w-[1.2em] font-sans-editorial text-[var(--color-rust)] pb-0 md:pb-2 text-[2.2rem] sm:text-[3.5rem] md:text-[5rem] lg:text-[6.2rem] leading-[1]"
                   />
                 </span>
                 trong <br className="block md:hidden"/>
                 danh sách lớp học <br className="hidden md:block"/>
                 của chúng ta.
               </motion.h1>

               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.6, duration: 1 }}
               >
                 <div className="text-[1.2rem] md:text-[2rem] font-sans-editorial font-light text-[var(--color-charcoal)]/60 tracking-normal inline-block mt-6 md:mt-8">
                   Vui lòng nhập số tương ứng để <br className="block md:hidden"/> mở trang kỷ yếu.
                 </div>
               </motion.div>

               <motion.div 
                 initial={{ opacity: 0 }}
                 animate={{ opacity: 1 }}
                 transition={{ delay: 0.8, duration: 1 }}
                 className="mt-8 md:mt-8 flex justify-start"
               >
                 {/* Universal UI UI/UX Button Enter to classic subtle look (both Mobile and PC) */}
                 {/* Khắc phục text wrap trên Mobile bằng cách tinh chỉnh padding, font-size và flex row. Căn đúng 1 dòng liền mạch */}
                 <button 
                   onClick={handleOpenCard}
                   className="flex text-[9px] sm:text-[10px] md:text-[13px] font-sans-editorial font-medium uppercase tracking-[0.2em] sm:tracking-[0.3em] text-[var(--color-charcoal)]/70 hover:text-[var(--color-rust)] transition-colors items-center gap-2 md:gap-3 group whitespace-nowrap"
                 >
                   <span>Bấm vào đây hoặc nhấn</span>
                   <span className="px-3 sm:px-4 py-1.5 border border-[var(--color-charcoal)]/30 rounded text-[9px] sm:text-[10px] group-hover:border-[var(--color-rust)]/80 bg-white/40 backdrop-blur-sm transition-all shadow-sm shrink-0">ENTER</span> 
                   <span>để tiếp tục</span>
                 </button>
               </motion.div>
            </div>

            <div className="absolute bottom-0 left-0 w-full z-20">
              <EditorialMarquee direction="right" text="TÔN VINH VẺ ĐẸP VÀ TRÍ TUỆ CỦA PHỤ NỮ" />
            </div>
          </motion.div>

        ) : (

          /* --- FRAME 2: AVANT-GARDE EDITORIAL TỐI THƯỢNG --- */
          <motion.div
            key="frame2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="w-full h-[100dvh] relative overflow-hidden z-10 bg-[var(--color-oatmeal)]"
          >
            
            {/* ========================================================
                📱 MOBILE ADVANCED UX (STORY INTERACTION & BOTTOM SHEET)
                ======================================================== */}
            <div className="flex md:hidden w-full h-[100dvh] relative overflow-hidden bg-[#1c1a19] text-[#f4f2ee] touch-none">
                
                {/* 1. Full Screen Image */}
                <div className="absolute inset-0 z-0">
                   <AnimatePresence mode="sync">
                     <motion.img 
                       key={currentImageIndex}
                       src={selectedGirl?.images?.[currentImageIndex] || selectedGirl?.images?.[0]}
                       initial={{ opacity: 0, scale: 1.05 }}
                       animate={{ opacity: 1, scale: 1 }}
                       exit={{ opacity: 0 }}
                       transition={{ duration: 1.2, ease: "easeOut" }}
                       className="absolute inset-0 w-full h-[100dvh] object-cover focus:outline-none"
                     />
                   </AnimatePresence>
                   <div className="absolute inset-0 bg-gradient-to-b from-black/0 via-black/20 to-black/95 pointer-events-none" />
                </div>

                {/* 2. Top Progress (Nút back loại bỏ hoàn toàn như gốc) */}
                <div className="absolute top-0 w-full px-4 pt-6 z-50 flex flex-col gap-4 pointer-events-auto">
                   <div className="flex gap-1.5 w-full">
                     {selectedGirl?.images?.map((_, idx) => (
                        <div key={idx} className="h-[2px] flex-1 bg-white/40 overflow-hidden rounded-full backdrop-blur-sm relative">
                           <motion.div 
                             className="absolute top-0 left-0 h-full bg-white block"
                             initial={{ width: currentImageIndex > idx ? "100%" : "0%" }}
                             animate={{ width: currentImageIndex === idx ? "100%" : (currentImageIndex > idx ? "100%" : "0%") }}
                             transition={{ duration: currentImageIndex === idx ? 5 : 0.3, ease: 'linear' }}
                           />
                        </div>
                     ))}
                   </div>
                </div>

                {/* 3. Tap Zones to change image */}
                <div className="absolute inset-y-20 left-0 w-[40%] z-40" onClick={prevImage} />
                <div className="absolute inset-y-20 right-0 w-[60%] z-40" onClick={nextImage} />

                {/* 4. Front Overlay Name Typography - Đặt lại ĐÚNG góc Trái Dưới, bố cục trượt thẳng, hạn chế rời rạc */}
                <div className="absolute bottom-[25%] left-6 z-20 pointer-events-none max-w-[85vw] flex flex-col gap-0 justify-end items-start text-left">
                   {selectedGirl?.name?.split(' ').map((word, i) => {
                      const baseSize = "text-[3.5rem] leading-[0.8]"; // Size ổn định cho 4 chữ
                      // Tinh tế bậc thang từ trái sang
                      let margin = `${i * 1.5}rem`; 
                      if(i > 3) margin = `${3 * 1.5}rem`; // Giới hạn lề để không tuột khung phải
                      return (
                         <motion.h1 
                           key={i} 
                           initial={{ opacity: 0, x: -20, y: 15 }}
                           animate={{ opacity: 1, x: 0, y: 0 }}
                           transition={{ delay: 0.6 + (i * 0.15), duration: 0.8 }}
                           style={{ marginLeft: margin }}
                           className={`font-serif-editorial italic ${baseSize} text-white drop-shadow-[0_4px_16px_rgba(0,0,0,0.8)] ${i % 2 === 0 ? 'font-bold' : 'font-light'}`}
                         >
                           {word}
                         </motion.h1>
                      )
                   })}
                </div>

                {/* 5. Bottom Action Area (Glass Button trigger Bottom Sheet) */}
                <div className="absolute bottom-6 w-full px-5 z-[55] flex flex-col items-center pointer-events-none">
                   <button 
                     onClick={() => setQuoteOpen(true)}
                     className="w-full bg-white/10 backdrop-blur-2xl border border-white/20 text-white rounded-[1.5rem] py-4 px-6 flex items-center justify-between group overflow-hidden relative pointer-events-auto shadow-[0_15px_30px_rgba(0,0,0,0.3)]"
                   >
                     <div className="absolute inset-0 bg-white/10 translate-y-full group-hover:translate-y-0 transition-transform duration-500" />
                     <div className="flex flex-col items-start relative z-10">
                        <span className="font-sans-editorial text-[9px] text-white/50 uppercase tracking-[0.3em] font-bold mb-1">Thao tác</span>
                        <span className="font-serif-editorial text-[1.4rem] italic leading-none">Giải mã thông điệp</span>
                     </div>
                     <div className="w-10 h-10 rounded-full bg-white text-[var(--color-charcoal)] flex items-center justify-center relative z-10 transition-transform group-hover:-translate-y-1 shadow-[0_0_20px_white]">
                        <ChevronUp size={20} strokeWidth={2} />
                     </div>
                   </button>
                </div>

                {/* 6. 🌟 ADVANCED DRAGGABLE BOTTOM SHEET - WIDER TEXT, QR STYLE 🌟 */}
                <AnimatePresence>
                  {quoteOpen && (
                    <>
                      <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setQuoteOpen(false)}
                        className="absolute inset-0 z-[60] bg-black/60 backdrop-blur-md pointer-events-auto"
                      />
                      <motion.div
                        drag="y"
                        dragConstraints={{ top: 0, bottom: 0 }}
                        onDragEnd={(e, info) => {
                           if (info.offset.y > 80 || info.velocity.y > 500) setQuoteOpen(false);
                        }}
                        initial={{ y: "100%" }}
                        animate={{ y: "0%" }}
                        exit={{ y: "100%" }}
                        transition={{ type: "spring", damping: 25, stiffness: 220, mass: 0.8 }}
                        className="absolute bottom-0 left-0 w-full h-[65dvh] z-[70] bg-[var(--color-oatmeal)] text-[var(--color-charcoal)] rounded-t-[2.5rem] pt-3 pb-8 px-6 flex flex-col shadow-[0_-20px_50px_rgba(0,0,0,0.5)] touch-none pointer-events-auto border-t border-[var(--color-oatmeal)]"
                      >
                         {/* Drag Handle */}
                         <div className="w-12 h-1.5 bg-[var(--color-charcoal)]/20 rounded-full mx-auto mb-6 shrink-0" />
                         
                         <div className="flex items-start justify-between mb-8 overflow-hidden shrink-0">
                            <div className="flex flex-col gap-1 mt-2">
                               <div className="flex items-center gap-2 text-[var(--color-charcoal)]/50 mb-1">
                                  <QrCode strokeWidth={1.5} size={22} className="text-[var(--color-rust)]" />
                                  <span className="font-sans-editorial text-[10px] uppercase tracking-[0.3em]">Mã định danh</span>
                               </div>
                               <span className="font-mono text-2xl text-[var(--color-charcoal)] tracking-widest font-medium">
                                 #83-{selectedGirl?.stt}
                               </span>
                            </div>
                            <CircularText text="TÔN VINH VẺ ĐẸP PHỤ NỮ • 8/3/2024 • " />
                         </div>

                         {/* Editorial Quote Block - Mở rộng ngang (w-full) */}
                         <div className="flex-1 w-full mx-auto relative mb-6 overflow-y-auto pr-1 pb-16">
                            <div className="pt-2 pb-6 px-1 h-full flex flex-col justify-start relative">
                               <span className="absolute -top-4 -left-1 text-7xl text-[var(--color-rust)] opacity-20 font-serif-editorial leading-none">"</span>
                               <p className="font-serif-editorial text-[1.65rem] leading-[1.4] text-[var(--color-charcoal)] relative z-10 text-justify">
                                 {selectedGirl?.wish || defaultWish}
                               </p>
                            </div>
                         </div>
                      </motion.div>
                    </>
                  )}
                </AnimatePresence>

            </div>

            {/* ========================================================
                💻 PC EDITORIAL MAGAZINE LAYOUT - CARD OVERLAY STYLING
                ======================================================== */}
            <div className="hidden md:flex flex-row w-full h-[100dvh] relative z-10 bg-[var(--color-oatmeal)]">
               
               {/* Back button */}
               <button 
                 onClick={() => setStep(1)}
                 className="absolute top-12 left-12 z-[60] text-[var(--color-charcoal)] hover:text-[var(--color-rust)] transition-colors p-2 mix-blend-difference"
               >
                 <ArrowLeft strokeWidth={1} size={36} />
               </button>

               {/* Left Context Area (40%) */}
               <div className="w-[40%] h-full flex flex-col justify-center pl-16 lg:pl-24 relative z-20 mix-blend-multiply">
                  <div className="flex flex-col items-start justify-center w-full">
                    {selectedGirl?.name?.split(' ').map((word, i) => {
                       // Tên ở PC sẽ setup xéo xuống (stagger) thay vì dọc 
                       let margin = `${i * 3}rem`; 
                       return (
                         <motion.h1 
                           key={i} 
                           initial={{ x: -20, opacity: 0 }}
                           animate={{ x: 0, opacity: 1 }}
                           transition={{ delay: 0.4 + (i * 0.15), duration: 1 }}
                           style={{ marginLeft: margin }}
                           className={`font-serif-editorial italic text-[5.5rem] lg:text-[7rem] leading-[0.85] tracking-tight text-[var(--color-charcoal)] drop-shadow-sm ${i % 2 === 0 ? 'font-bold' : 'font-light'}`}
                         >
                           {word}
                         </motion.h1>
                       )
                    })}
                  </div>
               </div>

               {/* Right Image Area (60%) with Overlay Card */}
               <div className="w-[60%] h-full relative p-12 pl-0 bg-[var(--color-oatmeal)] flex items-center justify-center">
                  
                  {/* Image Container */}
                  <div className="w-full h-full relative overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.15)] rounded-sm z-10">
                     <AnimatePresence mode="sync">
                       <motion.img 
                         key={currentImageIndex}
                         src={selectedGirl?.images?.[currentImageIndex] || selectedGirl?.images?.[0]}
                         initial={{ opacity: 0, scale: 1.05 }}
                         animate={{ opacity: 1, scale: 1 }}
                         exit={{ opacity: 0 }}
                         transition={{ duration: 1.2, ease: "easeOut" }}
                         className="absolute inset-0 w-full h-full object-cover"
                       />
                     </AnimatePresence>
                  </div>
                  
                  {/* Overlay Quote Card - Đặt lùi sang TRÁI (âm qua trái -left) tiến về gần tên, tránh cover chính diện khuôn mặt */}
                  <motion.div 
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.8, duration: 1 }}
                    className="absolute -left-[5%] lg:-left-[15%] bottom-[10%] w-[85%] max-w-[700px] bg-[var(--color-oatmeal)]/98 backdrop-blur-xl p-8 lg:p-10 shadow-[20px_20px_60px_rgba(0,0,0,0.25)] border border-[var(--color-charcoal)]/10 z-30"
                  >
                     <span className="absolute -top-7 -left-3 text-7xl text-[var(--color-rust)] opacity-30 font-serif-editorial leading-none">"</span>
                     <p className="font-serif-editorial text-[1.6rem] lg:text-[1.95rem] leading-[1.35] text-[var(--color-charcoal)] relative z-10 text-justify">
                       {selectedGirl?.wish || defaultWish}
                     </p>
                     
                     <div className="mt-8 pt-6 border-t border-[var(--color-charcoal)]/10 flex items-center justify-between">
                        <div className="flex items-center gap-2 text-[var(--color-charcoal)]/50">
                          <QrCode strokeWidth={1.5} size={18} className="text-[var(--color-rust)]" />
                          <span className="font-sans-editorial text-[10px] uppercase tracking-[0.2em]">ID: #83-{selectedGirl?.stt}</span>
                        </div>
                        <span className="font-sans-editorial text-[10px] uppercase tracking-[0.2em] font-bold text-[var(--color-rust)]">
                           2024
                        </span>
                     </div>
                  </motion.div>

                  {/* Pagination overlay on image */}
                  <div className="absolute top-16 right-16 z-[60] flex items-center gap-4 mix-blend-difference text-white">
                    <span className="font-serif-editorial italic text-3xl">
                      0{currentImageIndex + 1}
                    </span>
                    <div className="w-16 h-[1px] bg-white/50" />
                    <span className="font-sans-editorial text-[11px] uppercase tracking-[0.2em] opacity-80">
                      0{selectedGirl?.images?.length || 1}
                    </span>
                  </div>
               </div>
            </div>

          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default App;
