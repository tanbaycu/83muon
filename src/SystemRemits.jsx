import React, { useState, useRef, useCallback, useEffect } from 'react';
import { doc, setDoc, getDoc, collection, getDocs } from 'firebase/firestore';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { db, auth, provider } from '../lib/firebase';
import Cropper from 'react-easy-crop';
import { Camera, Save, Loader2, CheckCircle2, Eye, Bold, Italic, Link, List, Quote, PenTool, RotateCw, FlipHorizontal, LogOut, LayoutDashboard, Edit3, Lock, ShieldAlert, Search, FilePlus } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import imageCompression from 'browser-image-compression';

const getCroppedImg = async (imageSrc, pixelCrop) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.addEventListener('load', () => resolve(img));
    img.addEventListener('error', (err) => reject(err));
    img.src = imageSrc;
  });

  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;
  ctx.drawImage(
    image,
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height,
    0,
    0,
    pixelCrop.width,
    pixelCrop.height
  );
  return canvas.toDataURL('image/jpeg', 0.9);
};

const manipulateImage = async (src, type) => {
  const image = await new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (type === 'rotate') {
    canvas.width = image.height;
    canvas.height = image.width;
    ctx.translate(canvas.width / 2, canvas.height / 2);
    ctx.rotate(90 * Math.PI / 180);
    ctx.drawImage(image, -image.width / 2, -image.height / 2);
  } else if (type === 'flip') {
    canvas.width = image.width;
    canvas.height = image.height;
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(image, 0, 0);
  }
  return canvas.toDataURL('image/jpeg', 0.9);
};

export default function SystemRemits() {
  const [viewMode, setViewMode] = useState('editor'); // 'editor' | 'dashboard'
  const [dashboardData, setDashboardData] = useState([]);
  const [sttState, setSttState] = useState('unchecked'); // 'unchecked', 'available', 'owned', 'locked'

  const [stt, setStt] = useState('');
  const [name, setName] = useState('');
  const [wish, setWish] = useState('');
  const [signature, setSignature] = useState('');
  const [activeTab, setActiveTab] = useState('write');
  
  const [imageSrc, setImageSrc] = useState(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  const [isLoading, setIsLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState('');
  
  const [currentUser, setCurrentUser] = useState(null);
  const [isAuthChecking, setIsAuthChecking] = useState(true);

  const fileInputRef = useRef(null);

  const loadDashboard = async () => {
    setIsLoading(true);
    try {
      const q = collection(db, 'girls');
      const snap = await getDocs(q);
      const list = [];
      snap.forEach(d => list.push(d.data()));
      list.sort((a,b) => a.stt && b.stt ? a.stt.localeCompare(b.stt) : 0);
      setDashboardData(list);
    } catch(e) {
      console.error(e);
      alert('Lỗi tải Dashboard: ' + e.message);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    if (viewMode === 'dashboard') {
      loadDashboard();
    }
  }, [viewMode]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setIsAuthChecking(false);
    });
    return () => unsubscribe();
  }, []);

  const handleLogin = async () => {
    setIsAuthChecking(true);
    try {
      await signInWithPopup(auth, provider);
    } catch (err) {
      console.error(err);
      alert('Đăng nhập thất bại: ' + err.message);
      setIsAuthChecking(false);
    }
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleFileChange = async (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      let imageDataUrl = await readFile(file);
      setImageSrc(imageDataUrl);
      setCroppedImage(null);
    }
  };

  const readFile = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.addEventListener('load', () => resolve(reader.result), false);
      reader.readAsDataURL(file);
    });
  };

  const handleFinishCrop = async () => {
    try {
      const croppedDataUrl = await getCroppedImg(imageSrc, croppedAreaPixels);
      setCroppedImage(croppedDataUrl);
      setImageSrc(null);
    } catch (e) {
      console.error(e);
      alert('Lỗi cắt ảnh!');
    }
  };

  const handleManipulate = async (type) => {
    if(!imageSrc) return;
    try {
      const newSrc = await manipulateImage(imageSrc, type);
      setImageSrc(newSrc);
    } catch(e) {
      console.error(e);
    }
  };

  const handleSttChange = (val) => {
    setStt(val);
    if(sttState !== 'unchecked') {
      setSttState('unchecked');
      setStatusMsg('STT đã thay đổi. Vui lòng bấm "Kiểm tra STT" trước khi tiếp tục.');
    }
  };

  const handleCheckSTT = async () => {
    if (!stt) {
      alert('Vui lòng nhập Mã định danh (STT/ID) trước!');
      return;
    }
    setIsLoading(true);
    setStatusMsg('Đang kiểm tra dữ liệu...');
    try {
      const docRef = doc(db, 'girls', stt);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data();
        const ownerUid = data.authorUid;
        
        if (!ownerUid || ownerUid === currentUser.uid) {
          setName(data.name || '');
          setWish(data.wish || '');
          setSignature(data.signature || '');
          setCroppedImage(data.imageUrl ? data.imageUrl : null);
          setImageSrc(null);
          setSttState('owned');
          setStatusMsg('STT đã có dữ liệu và thuộc quyền sở hữu của BẠN. Được phép sửa.');
        } else {
          setName('');
          setWish('');
          setSignature('');
          setCroppedImage(null);
          setImageSrc(null);
          setSttState('locked');
          setStatusMsg(`STT Bị Khóa. Đã được thay đổi bởi: ${data.authorEmail || 'Người khác'}. Bạn KHÔNG CÓ QUYỀN sửa.`);
        }
      } else {
        setName('');
        setWish('');
        setSignature('');
        setCroppedImage(null);
        setImageSrc(null);
        setSttState('available');
        setStatusMsg('STT Hợp Lệ (Trống). Bạn có thể biên soạn và lưu mới.');
      }
    } catch (err) {
      console.error(err);
      setStatusMsg('Lỗi kiểm tra hệ thống!');
    }
    setIsLoading(false);
  };

  const handleClearForm = () => {
    setStt('');
    setName('');
    setWish('');
    setSignature('');
    setCroppedImage(null);
    setImageSrc(null);
    setSttState('unchecked');
    setStatusMsg('');
    window.scrollTo({top: 0, behavior: 'smooth'});
  };

  const handleSave = async () => {
    if (sttState === 'unchecked') {
      alert('Vui lòng nhấn nút "Kiểm tra STT" để hệ thống xác nhận dữ liệu trước khi lưu!');
      return;
    }
    if (sttState === 'locked') {
      alert('Thao tác từ chối: Bạn không có quyền ghi đè lên STT của người khác!');
      return;
    }
    if (!stt || !name || !wish) {
      alert('Bạn cần điền tối thiểu STT, Tên và Lời chúc.');
      return;
    }
    if (!croppedImage && !imageSrc) {
      alert('Vui lòng chọn một bức ảnh ấn tượng nhé!');
      return;
    }

    setIsLoading(true);
    setStatusMsg('Đang xử lý...');

    try {
      let finalImageUrl = croppedImage;
      if (!finalImageUrl && imageSrc) {
        finalImageUrl = imageSrc; 
      }
      
      if (finalImageUrl && finalImageUrl.startsWith('data:image')) {
        setStatusMsg('Đang xử lý và nén ảnh (Tối ưu bằng thuật toán)...');
        
        // Chuyển base64 DataURL sang File Blob cho library
        const res = await fetch(finalImageUrl);
        const blob = await res.blob();
        const imageFile = new File([blob], `avatar_${stt}.jpg`, { type: 'image/jpeg' });

        const options = {
          maxSizeMB: 0.05, // Ép dung lượng dưới 50KB để chuỗi Base64 nhẹ nhất có thể mang vào Firestore < 1MB
          maxWidthOrHeight: 600,
          useWebWorker: true,
          initialQuality: 0.7
        };

        const compressedFile = await imageCompression(imageFile, options);

        // Chuyển từ Blob File ngược lại sang base64 data_url để lưu thẳng vào Database (Bypass Storage)
        finalImageUrl = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(compressedFile);
          reader.onloadend = () => resolve(reader.result);
          reader.onerror = error => reject(error);
        });
      }

      setStatusMsg('Đang đóng gói dữ liệu...');
      await setDoc(doc(db, 'girls', stt), {
        stt,
        name,
        wish,
        signature,
        imageUrl: finalImageUrl,
        updatedAt: new Date().toISOString(),
        authorUid: currentUser.uid,
        authorEmail: currentUser.email || 'Admin'
      }, { merge: true });

      setStatusMsg('Hoàn tất! Hệ thống đã ghi nhận.');
      setTimeout(() => setStatusMsg(''), 4000);
    } catch (err) {
      console.error(err);
      setStatusMsg('Lỗi: ' + err.message);
    }
    setIsLoading(false);
  };

  const handlePreview = () => {
    if (!name || (!croppedImage && !imageSrc)) {
      alert('Chúng tôi cần biết Danh xưng và có Ảnh để có thể giả lập bản xem trước!');
      return;
    }
    const previewData = {
       stt: stt || '00',
       name: name || 'Danh Xưng Giả Lập',
       wish: wish || 'Mong mọi điều tốt lành và vui vẻ nhất sẽ đến với bạn trong ngày hôm nay.',
       signature: signature || '',
       imageUrl: croppedImage || imageSrc
    };
    localStorage.setItem('temp_preview_83', JSON.stringify(previewData));
    window.open(`/#/?preview=local`, '_blank');
  };

  const handleFormat = (prefix, suffix) => {
    const textarea = document.getElementById('wish-editor');
    if (!textarea) return;
    
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = wish.slice(start, end);
    const newText = wish.slice(0, start) + prefix + selectedText + suffix + wish.slice(end);
    
    setWish(newText);
    setTimeout(() => {
      textarea.focus();
      textarea.setSelectionRange(start + prefix.length, end + prefix.length);
    }, 0);
  };

  if (isAuthChecking) {
    return (
      <div className="h-[100dvh] w-full flex items-center justify-center bg-[#faf8f5]">
        <Loader2 className="animate-spin text-[#a65d57]" size={32} />
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="h-[100dvh] w-full flex flex-col items-center justify-center bg-[#faf8f5] text-[#1c1a19] font-sans-editorial px-6">
        <h1 className="text-4xl font-serif-editorial text-center mb-4">Hệ thống <br/>Quản lý CSDL</h1>
        <p className="opacity-50 text-sm text-center mb-10 max-w-sm">
          Vì lý do bảo mật, bạn cần đăng nhập tài khoản có quyền Admin để tiếp tục tải ảnh lên Firebase Storage.
        </p>
        <button 
          onClick={handleLogin}
          className="bg-[#1c1a19] text-white px-8 py-4 rounded-xl font-bold uppercase tracking-widest text-xs hover:bg-[#34302e] transition-colors shadow-lg active:scale-95 flex items-center gap-3"
        >
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Đăng nhập với Google
        </button>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] w-full overflow-y-auto bg-[#faf8f5] text-[#1c1a19] font-sans-editorial">
      <div className="max-w-2xl mx-auto px-6 py-10 flex flex-col gap-12 pb-32">
        
        {/* HEADER */}
        <div className="flex flex-col gap-2 relative">
          <div className="flex items-center justify-between w-full">
            <div className="inline-block px-3 py-1 bg-[#a65d57]/10 text-[#a65d57] text-[10px] font-bold tracking-[0.2em] rounded-full w-max uppercase">
              Workspace Admin
            </div>
            <button 
              onClick={() => signOut(auth)}
              className="text-[#1c1a19]/50 hover:text-[#a65d57] transition-colors p-2"
              title="Đăng xuất"
            >
              <LogOut size={16} />
            </button>
          </div>
          <h1 className="text-4xl sm:text-5xl font-serif-editorial tracking-tight font-light mt-3 leading-[1.1]">
            Trung tâm <br className="block sm:hidden"/> Điều phối <span className="font-bold italic">Dữ liệu</span>
          </h1>
          <p className="opacity-50 text-xs sm:text-sm font-medium mt-2">Cập nhật thông tin hoa khôi theo mã định danh nhanh nhất.</p>
        </div>

        <div className="flex bg-[#1c1a19]/5 rounded-xl p-1 shrink-0 w-full sm:w-auto self-start mt-2">
            <button 
               onClick={() => setViewMode('editor')} 
               className={`flex-1 sm:flex-none uppercase px-6 py-3 sm:py-2 text-[10px] sm:text-xs font-bold tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${viewMode === 'editor' ? 'bg-white shadow-sm text-[#1c1a19]' : 'text-[#1c1a19]/50 hover:text-[#1c1a19]'}`}
            >
               <Edit3 size={16} /> Trình soạn thảo
            </button>
            <button 
               onClick={() => setViewMode('dashboard')} 
               className={`flex-1 sm:flex-none uppercase px-6 py-3 sm:py-2 text-[10px] sm:text-xs font-bold tracking-wider rounded-lg flex items-center justify-center gap-2 transition-all ${viewMode === 'dashboard' ? 'bg-white shadow-sm text-[#a65d57]' : 'text-[#1c1a19]/50 hover:text-[#1c1a19]'}`}
            >
               <LayoutDashboard size={16} /> Quản lý Dữ liệu
            </button>
        </div>

        <div className="w-full h-[1px] bg-[#1c1a19]/10" />

        {viewMode === 'dashboard' ? (
           <div className="flex flex-col gap-6 w-full animate-fadeIn">
              <div className="flex justify-between items-center px-1">
                <h2 className="text-2xl font-bold font-serif-editorial">Danh sách đã nộp ({dashboardData.length})</h2>
                <button onClick={loadDashboard} className="text-[10px] font-bold uppercase tracking-widest text-[#a65d57] hover:underline p-2 flex items-center gap-1"><RotateCw size={12}/> Làm mới</button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {dashboardData.map(d => {
                    const isMine = !d.authorUid || d.authorUid === currentUser.uid;
                    return (
                        <div key={d.stt} className={`flex flex-col gap-3 p-5 rounded-2xl border transition-all hover:-translate-y-1 hover:shadow-md ${isMine ? 'border-[#a65d57]/40 bg-white shadow-sm' : 'border-[#1c1a19]/10 bg-[#1c1a19]/5'} relative`}>
                            <div className="flex justify-between items-start gap-3">
                                <div className="flex flex-col flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                       <span className="text-[10px] font-bold uppercase tracking-widest text-white bg-[#1c1a19] px-2 py-0.5 rounded-full inline-block">STT: {d.stt}</span>
                                       {isMine && <span className="text-[9px] font-bold uppercase text-green-700 bg-green-100 px-2 py-0.5 rounded-sm inline-block tracking-widest">Sở hữu</span>}
                                    </div>
                                    <h3 className="text-xl font-serif-editorial font-bold mt-2 text-[#1c1a19] truncate">{d.name}</h3>
                                    <p className="text-[10px] font-mono text-[#1c1a19]/50 mt-1 truncate tracking-wider" title={d.authorEmail}>{d.authorEmail || 'Legacy/Ẩn danh'}</p>
                                </div>
                                {d.imageUrl && <div className="w-14 h-14 rounded-full overflow-hidden shrink-0 border-[2px] border-white shadow-sm"><img src={d.imageUrl} className="w-full h-full object-cover bg-[#1c1a19]/10" /></div>}
                            </div>
                            <div className="flex justify-end mt-2 pt-3 border-t border-[#1c1a19]/5">
                                {isMine ? (
                                    <button onClick={() => {
                                       setStt(d.stt);
                                       setViewMode('editor');
                                       setName(d.name || '');
                                       setWish(d.wish || '');
                                       setSignature(d.signature || '');
                                       setCroppedImage(d.imageUrl || null);
                                       setImageSrc(null);
                                       setSttState('owned');
                                       setStatusMsg('Đã chuyển sang chế độ sửa từ Dashboard. Hãy chỉnh sửa và nhấn Lưu.');
                                       window.scrollTo({top: 0, behavior: 'smooth'});
                                    }} className="px-5 py-2.5 bg-[#1c1a19] text-white text-[10px] uppercase tracking-widest font-bold rounded-lg hover:bg-[#34302e] transition-colors flex items-center gap-2">
                                       <Edit3 size={14} /> Chỉnh sửa
                                    </button>
                                ) : (
                                    <div className="flex items-center gap-1.5 px-3 py-2.5 bg-[#1c1a19]/10 text-[#1c1a19]/50 text-[10px] uppercase tracking-widest font-bold rounded-lg cursor-not-allowed">
                                        <Lock size={14} /> Hệ thống khóa
                                    </div>
                                )}
                            </div>
                        </div>
                    )
                })}
                {dashboardData.length === 0 && !isLoading && (
                    <p className="text-sm opacity-50 italic sm:col-span-2 text-center py-10">Chưa có dữ liệu nào trên hệ thống.</p>
                )}
                {isLoading && (
                    <div className="col-span-full py-10 flex justify-center"><Loader2 className="animate-spin text-[#a65d57]" size={32} /></div>
                )}
              </div>
           </div>
        ) : (
           <div className="flex flex-col gap-10 w-full animate-fadeIn">
              {/* CỤM 1: ĐỊNH DANH */}
              <div className="flex flex-col gap-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-end gap-5">
                  <div className="flex flex-col gap-2 w-full">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Mã định danh (STT)</label>
                    <input 
                      type="text" 
                      value={stt}
                      onChange={e => handleSttChange(e.target.value)}
                      placeholder="VD: 01, 15, NgocLan" 
                      className={`w-full bg-transparent border-b outline-none py-2 text-2xl font-serif-editorial transition-all ${sttState === 'locked' ? 'border-red-500 focus:border-red-600 text-red-600' : 'border-[#1c1a19]/20 focus:border-[#a65d57]'}`}
                    />
                    {sttState !== 'unchecked' && (
                      <div className="text-[11px] font-medium flex items-center gap-1.5 mt-2 transition-all opacity-100 bg-white/50 p-2 border border-[#1c1a19]/5 rounded-md">
                        {sttState === 'available' && <><CheckCircle2 size={14} className="text-green-600" /> <span className="text-green-700 font-bold tracking-wide">KHẢ DỤNG - Bản ghi Mới, hãy nhập tên</span></>}
                        {sttState === 'owned' && <><Edit3 size={14} className="text-[#a65d57]" /> <span className="text-[#a65d57] font-bold tracking-wide">THUỘC VỀ BẠN - Đang mở Cấp quyền sửa</span></>}
                        {sttState === 'locked' && <><ShieldAlert size={14} className="text-red-500" /> <span className="text-red-600 font-bold tracking-wide">ĐÃ BỊ KHÓA BỞI NGƯỜI KHÁC</span></>}
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 sm:w-auto w-full">
                    {sttState !== 'unchecked' && (
                      <button 
                        onClick={handleClearForm}
                        className="w-full sm:w-auto bg-white text-[#a65d57] px-6 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 border border-[#a65d57]/30 hover:bg-[#a65d57]/5 shadow-sm"
                      >
                        <FilePlus size={16} /> Clear / Thêm mới
                      </button>
                    )}
                    <button 
                      onClick={handleCheckSTT}
                      disabled={isLoading || !stt}
                      className="w-full sm:w-auto bg-[#1c1a19] text-white px-8 py-3 rounded-xl text-sm font-bold uppercase tracking-wider transition-all flex items-center justify-center gap-2 shrink-0 active:scale-[0.98] disabled:opacity-50 hover:bg-[#34302e] shadow-md border border-[#1c1a19]/20"
                    >
                      {isLoading ? <Loader2 size={16} className="animate-spin" /> : <Search size={16} />}
                      <span className="mt-0.5">Kiểm tra STT</span>
                    </button>
                  </div>
                </div>
              </div>

              <div className="w-full h-[1px] bg-[#1c1a19]/10" />

              <div className={`flex flex-col gap-10 transition-all duration-300 ${sttState === 'unchecked' || sttState === 'locked' ? 'opacity-30 pointer-events-none grayscale-[0.5]' : 'opacity-100'}`}>
                {/* CỤM 2: NỘI DUNG CHÍNH */}
                <div className="flex flex-col gap-10">
                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Danh xưng hiển thị</label>
                    <input 
                      type="text" 
                      value={name}
                      onChange={e => setName(e.target.value)}
                      placeholder="Ví dụ: Cẩm Tú, Cặp Bài Trùng, Hotgirl số 1..." 
                      className="w-full bg-transparent border-b border-[#1c1a19]/20 focus:border-[#a65d57] outline-none py-3 text-3xl sm:text-4xl font-serif-editorial italic transition-all"
                    />
                  </div>

                  <div className="flex flex-col gap-3 sm:gap-2 relative">
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0 mb-1">
                       <label className="text-[10px] sm:text-xs uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50 block">Trích dẫn & Lời chúc</label>
                       <div className="flex bg-[#1c1a19]/5 rounded-lg p-1 self-start sm:self-auto w-full sm:w-auto">
                         <button 
                           onClick={() => setActiveTab('write')} 
                           className={`flex-1 sm:flex-none uppercase px-4 py-2 sm:py-1.5 text-[9px] sm:text-xs font-bold tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all ${activeTab === 'write' ? 'bg-white shadow-sm text-[#1c1a19]' : 'text-[#1c1a19]/50 hover:text-[#1c1a19]'}`}
                         >
                           <PenTool size={12} /> Soạn thảo
                         </button>
                         <button 
                           onClick={() => setActiveTab('preview')} 
                           className={`flex-1 sm:flex-none uppercase px-4 py-2 sm:py-1.5 text-[9px] sm:text-xs font-bold tracking-wider rounded-md flex items-center justify-center gap-1.5 transition-all ${activeTab === 'preview' ? 'bg-white shadow-sm text-[#a65d57]' : 'text-[#1c1a19]/50 hover:text-[#1c1a19]'}`}
                         >
                           <Eye size={12} /> Xem nhanh
                         </button>
                       </div>
                    </div>

                    {activeTab === 'write' ? (
                      <div className="w-full flex flex-col transition-colors group">
                        {/* Markdown Toolbar */}
                        <div className="flex items-center gap-1 pb-3 mb-2 border-b border-[#1c1a19]/10 overflow-x-auto shrink-0 touch-pan-x opacity-60 group-focus-within:opacity-100 transition-opacity">
                           <button onClick={() => handleFormat('**', '**')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Bold"><Bold size={16} /></button>
                           <button onClick={() => handleFormat('_', '_')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Italic"><Italic size={16} /></button>
                           <div className="w-[1px] h-4 bg-[#1c1a19]/20 mx-1 shrink-0" />
                           <button onClick={() => handleFormat('> ', '')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Quote"><Quote size={16} /></button>
                           <button onClick={() => handleFormat('- ', '')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="List"><List size={16} /></button>
                           <div className="w-[1px] h-4 bg-[#1c1a19]/20 mx-1 shrink-0" />
                           <button onClick={() => handleFormat('[Title](', ')')} className="p-2 hover:bg-[#1c1a19]/10 rounded-md text-[#1c1a19] transition-colors" title="Link"><Link size={16} /></button>
                        </div>
                        
                        <textarea 
                          id="wish-editor"
                          value={wish}
                          onChange={e => setWish(e.target.value)}
                          placeholder="Hỗ trợ Markdown (**Đậm**, _Nghiêng_)..." 
                          rows={6}
                          className="w-full bg-transparent border-none outline-none py-2 text-xl font-serif-editorial resize-y leading-[1.6]"
                        />
                      </div>
                    ) : (
                      <div className="w-full bg-white/50 border border-[#1c1a19]/10 p-6 rounded-[1rem] min-h-[160px] max-h-[400px] overflow-y-auto mt-2">
                         <div className="font-serif-editorial relative z-10 text-justify w-full">
                            <ReactMarkdown 
                              remarkPlugins={[remarkGfm]}
                              components={{
                                p: ({node, ...props}) => <p className="text-[1.3rem] leading-[1.5] text-[#1c1a19] mb-4" {...props} />,
                                strong: ({node, ...props}) => <strong className="font-bold text-[#a65d57]" {...props} />,
                                em: ({node, ...props}) => <em className="italic font-light" {...props} />,
                                blockquote: ({node, ...props}) => <blockquote className="border-l-4 border-[#a65d57] pl-4 italic opacity-80 shrink-0 mb-4" {...props} />,
                                ul: ({node, ...props}) => <ul className="list-disc pl-5 mb-4 space-y-2 text-[1.2rem]" {...props} />,
                                a: ({node, ...props}) => <a className="text-[#a65d57] underline underline-offset-4" {...props} />
                              }}
                            >
                              {wish || '*Chưa có nội dung.*'}
                            </ReactMarkdown>
                         </div>
                      </div>
                    )}
                    
                  </div>

                  <div className="flex flex-col gap-2">
                    <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Người gửi / Ký tên (Không bắt buộc)</label>
                    <input 
                      type="text" 
                      value={signature}
                      onChange={e => setSignature(e.target.value)}
                      placeholder="Ví dụ: - Ban Tổ Chức, Thằng bạn chí cốt..." 
                      className="w-full bg-transparent border-b border-[#1c1a19]/20 focus:border-[#a65d57] outline-none py-2 text-xl font-serif-editorial transition-all"
                    />
                  </div>
                </div>

                <div className="w-full h-[1px] bg-[#1c1a19]/10" />

                {/* CỤM 3: HÌNH ẢNH */}
                <div className="flex flex-col gap-6">
                   <label className="text-[10px] uppercase tracking-[0.2em] font-semibold text-[#1c1a19]/50">Ảnh chân dung</label>
                   
                   {!imageSrc && (
                     <div className="flex flex-col sm:flex-row gap-5 items-center">
                       {croppedImage && (
                         <div className="w-28 h-28 rounded-full overflow-hidden border-[3px] border-white shadow-[0_8px_20px_rgba(0,0,0,0.15)] shrink-0">
                           <img src={croppedImage} alt="Avatar" className="w-full h-full object-cover" />
                         </div>
                       )}
                       <input 
                         type="file" 
                         accept="image/*" 
                         ref={fileInputRef} 
                         onChange={handleFileChange} 
                         className="hidden" 
                       />
                       <button 
                         onClick={() => fileInputRef.current?.click()}
                         className="flex flex-col items-center justify-center gap-3 border-[1.5px] border-dashed border-[#1c1a19]/20 hover:border-[#1c1a19]/50 hover:bg-[#1c1a19]/5 text-[#1c1a19]/70 w-full rounded-[1rem] transition-all h-32 active:scale-[0.99]"
                       >
                         <Camera size={28} strokeWidth={1.5} />
                         <span className="font-semibold text-xs uppercase tracking-widest">Tải ảnh lên</span>
                       </button>
                     </div>
                   )}

                   {imageSrc && (
                     <div className="flex flex-col gap-4">
                       <div className="relative w-full h-[60vh] sm:h-[450px] bg-[#1c1a19] rounded-[1rem] overflow-hidden shadow-inner">
                         <Cropper
                            image={imageSrc}
                            crop={crop}
                            zoom={zoom}
                            aspect={1}
                            cropShape="round"
                            showGrid={true}
                            onCropChange={setCrop}
                            onCropComplete={onCropComplete}
                            onZoomChange={setZoom}
                          />
                       </div>
                       
                       <div className="flex flex-col gap-4 p-5 bg-[#faf8f5] rounded-[1rem] border border-[#1c1a19]/5">
                          <div className="flex items-center gap-4 w-full">
                            <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-[#a65d57] shrink-0">Scale</span>
                            <input
                              type="range"
                              value={zoom}
                              min={1}
                              max={3}
                              step={0.05}
                              aria-labelledby="Zoom"
                              onChange={(e) => setZoom(e.target.value)}
                              className="w-full h-1.5 bg-[#1c1a19]/10 rounded-lg appearance-none cursor-pointer accent-[#a65d57]"
                            />
                          </div>
                          
                          <div className="flex flex-row justify-between items-center w-full gap-2">
                            <div className="flex gap-2 shrink-0">
                              <button 
                                onClick={() => handleManipulate('rotate')}
                                className="p-3 bg-white hover:bg-black/5 text-[#1c1a19] border border-[#1c1a19]/10 rounded-xl transition-colors active:scale-95 flex items-center justify-center"
                                title="Xoay trái"
                              >
                                <RotateCw size={18} />
                              </button>
                              <button 
                                onClick={() => handleManipulate('flip')}
                                className="p-3 bg-white hover:bg-black/5 text-[#1c1a19] border border-[#1c1a19]/10 rounded-xl transition-colors active:scale-95 flex items-center justify-center"
                                title="Lật ngang"
                              >
                                <FlipHorizontal size={18} />
                              </button>
                            </div>

                            <div className="flex gap-2 flex-1 justify-end">
                              <button 
                                onClick={() => setImageSrc(null)}
                                className="bg-white hover:bg-black/5 text-[#1c1a19] border border-[#1c1a19]/10 px-4 py-3 rounded-xl font-bold transition-colors text-xs uppercase tracking-wider active:scale-95"
                              >
                                Hủy
                              </button>
                              <button 
                                onClick={handleFinishCrop}
                                className="bg-[#1c1a19] hover:bg-[#34302e] text-white px-5 py-3 rounded-xl font-bold transition-colors shadow-lg flex items-center justify-center gap-2 text-xs uppercase tracking-wider active:scale-95 w-full sm:w-auto"
                              >
                                Xác nhận
                              </button>
                            </div>
                          </div>
                       </div>
                     </div>
                   )}
                </div>

              </div> {/* /div wrapper disable form */}
           </div>
        )} {/* /ternary viewMode */}
      </div>

      {/* FLOAT ACTION BAR (MOBILE OPTIMIZED) - CHỈ HIỂN THỊ KHI Ở EDITOR */}
      {viewMode === 'editor' && (
      <div className={`fixed bottom-0 left-0 w-full bg-white/80 backdrop-blur-xl border-t border-[#1c1a19]/10 p-4 sm:p-6 z-[100] pb-safe shadow-[0_-10px_30px_rgba(0,0,0,0.05)] transition-all duration-300 ${sttState === 'unchecked' || sttState === 'locked' ? 'translate-y-[150%]' : 'translate-y-0'}`}>
         <div className="max-w-3xl mx-auto flex flex-col gap-3">
           
           <div className="flex items-center gap-2 justify-center text-[11px] uppercase tracking-widest font-semibold text-center w-full mb-1">
              {isLoading && <Loader2 className="animate-spin text-[#a65d57]" size={14} />}
              {statusMsg && !isLoading && <CheckCircle2 size={14} className={statusMsg.includes('Lỗi') ? 'text-red-500' : 'text-green-600'} />}
              <span className={!isLoading && statusMsg.includes('Lỗi') ? 'text-red-500' : (isLoading ? 'text-[#a65d57]' : 'text-green-700')}>{statusMsg}</span>
           </div>
           
           <div className="flex gap-3 mt-2 sm:mt-0">
             <button 
               onClick={handlePreview}
               className="w-16 sm:w-auto sm:flex-1 h-14 sm:h-auto sm:py-4 rounded-2xl bg-white border border-[#1c1a19]/10 hover:bg-[#faf8f5] text-[#1c1a19] font-bold transition-colors shadow-sm text-xs sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 active:scale-[0.98] shrink-0"
               title="Xem Trước Layout"
             >
               <Eye size={20} /> <span className="hidden sm:inline">Xem trước</span>
             </button>
             
             <button 
               onClick={handleSave}
               disabled={isLoading}
               className="flex-1 h-14 sm:h-auto sm:py-4 rounded-2xl bg-[#a65d57] hover:bg-[#8e4f4a] text-white font-bold transition-all shadow-[0_4px_20px_rgba(166,93,87,0.4)] text-[11px] sm:text-sm uppercase tracking-widest flex items-center justify-center gap-2 disabled:opacity-50 disabled:grayscale active:scale-[0.98]"
             >
               {isLoading ? 'Đang cập nhật...' : <><Save size={18} /> Lưu Dữ Liệu</>}
             </button>
           </div>
         </div>
      </div>
      )}

    </div>
  );
}
