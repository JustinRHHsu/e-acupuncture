# 手穴導引（另版原型）

此目錄的 `index.html` 原樣匯入使用者提供的 `index.zip`，保留原始介面、資料及互動行為；未覆蓋專案根目錄的尬電儀原型。

在專案根目錄執行 `npm start`，開啟 `/prototypes/hand-guide/`。

此版本為單一 HTML 檔案，使用 import map 從 jsDelivr 載入 Three.js 0.160.0 及 OrbitControls，需要網路連線。Google Fonts 無法載入時使用系統備援字體。

功能包括 3D 手部旋轉、左右手、手心／手背切換、症狀挑選與穴位瀏覽。原型中的手穴分類與根目錄的標準經穴參考圖為不同資料，未合併兩者。

## GitHub Pages

此版本另以 `gh-pages` 分支根目錄提供發布檔案。在 GitHub 專案的 **Settings → Pages** 選擇 **Deploy from a branch → gh-pages → / (root)**，儲存並等待部署完成。

預期網站位址為 `https://justinrhhsu.github.io/e-acupuncture/`；分支推送本身不代表 Pages 已啟用或網址已可用。

更新本目錄並提交到 `main` 後，可從專案根目錄執行 `git subtree split --prefix prototypes/hand-guide -b pages-update`，再以 `git push origin pages-update:gh-pages` 更新發布分支。請確認遠端版本並保留後續變更，不使用強制推送。
