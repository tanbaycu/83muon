import { initializeApp } from "firebase/app";
import { getFirestore, doc, deleteDoc, getDoc } from "firebase/firestore";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";
import readline from "readline";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import Firebase config from lib folder
const firebaseConfigPath = path.join(__dirname, "..", "lib", "firebase.js");
const firebaseConfigContent = fs.readFileSync(firebaseConfigPath, "utf-8");

// Extract config using regex since it's an ES module that we can't easily require directly here
const apiKeyMatch = firebaseConfigContent.match(/apiKey:\s*['"](.*?)['"]/);
const authDomainMatch = firebaseConfigContent.match(/authDomain:\s*['"](.*?)['"]/);
const projectIdMatch = firebaseConfigContent.match(/projectId:\s*['"](.*?)['"]/);
const storageBucketMatch = firebaseConfigContent.match(/storageBucket:\s*['"](.*?)['"]/);
const messagingSenderIdMatch = firebaseConfigContent.match(/messagingSenderId:\s*['"](.*?)['"]/);
const appIdMatch = firebaseConfigContent.match(/appId:\s*['"](.*?)['"]/);

if (!apiKeyMatch || !projectIdMatch) {
  console.error("❌ Không thể đọc cấu hình Firebase từ lib/firebase.js");
  process.exit(1);
}

const firebaseConfig = {
  apiKey: apiKeyMatch[1],
  authDomain: authDomainMatch[1],
  projectId: projectIdMatch[1],
  storageBucket: storageBucketMatch[1],
  messagingSenderId: messagingSenderIdMatch[1],
  appId: appIdMatch[1]
};

// Khởi tạo app bằng config dự án
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

console.log("----------------------------------------");
console.log("🔥 CÔNG CỤ XÓA NHANH DỮ LIỆU CỦA ADMIN 🔥");
console.log("----------------------------------------");

const askSTT = () => {
  rl.question("\n📝 Nhập Mã định danh (STT) cần xóa (hoặc gõ 'exit' để thoát): ", async (stt) => {
    if (stt.toLowerCase() === 'exit') {
      console.log("👋 Đã thoát phiên làm việc.");
      rl.close();
      process.exit(0);
    }

    if (!stt.trim()) {
      console.log("⚠️ STT không hợp lệ.");
      return askSTT();
    }

    try {
      const docRef = doc(db, 'girls', stt.trim());
      const docSnap = await getDoc(docRef);

      if (!docSnap.exists()) {
        console.log(`❌ LỖI: Không tìm thấy dữ liệu cho STT [${stt}]. Dữ liệu có thể đã bị xóa hoặc rỗng.`);
      } else {
        const data = docSnap.data();
        console.log(`\n🔍 TÌM THẤY DỮ LIỆU:`);
        console.log(`- Tên: ${data.name || '<Không tên>'}`);
        console.log(`- Trích dẫn: ${data.wish ? data.wish.substring(0, 50) + '...' : '<Rỗng>'}`);
        console.log(`- Tác giả: ${data.authorEmail || 'Legacy/Ẩn danh'}`);
        
        rl.question(`❓ Bạn CÓ CHẮC CHẮN muốn vĩnh viễn xóa STT [${stt}] không? (Y/N): `, async (confirm) => {
          if (confirm.toLowerCase() === 'y' || confirm.toLowerCase() === 'yes') {
            await deleteDoc(docRef);
            console.log(`✅ THÀNH CÔNG: Dữ liệu của STT [${stt}] đã bị xóa hoàn toàn khỏi hệ thống!`);
          } else {
            console.log(`🛑 ĐÃ HỦY THAO TÁC XÓA.`);
          }
          askSTT();
        });
        return; // Wait for confirm
      }
    } catch (error) {
      console.error("❌ ĐÃ XẢY RA LỖI SERVER KHI XÓA: ", error.message);
    }
    
    askSTT();
  });
};

askSTT();
