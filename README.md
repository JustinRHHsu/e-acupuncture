# 手穴導引（另版原型）

此目錄的 `index.html` 原樣匯入使用者提供的 `index.zip`，保留原始介面、資料及互動行為；未覆蓋專案根目錄的尬電儀原型。

在專案根目錄執行 `npm start`，開啟 `/prototypes/hand-guide/`。

此版本為單一 HTML 檔案，使用 import map 從 jsDelivr 載入 Three.js 0.160.0 及 OrbitControls，需要網路連線。Google Fonts 無法載入時使用系統備援字體。

功能包括 3D 手部旋轉、左右手、手心／手背切換、症狀挑選與穴位瀏覽。原型中的手穴分類與根目錄的標準經穴參考圖為不同資料，未合併兩者。

## GitHub Pages

此版本另以 `gh-pages` 分支根目錄提供發布檔案。在 GitHub 專案的 **Settings → Pages** 選擇 **Deploy from a branch → gh-pages → / (root)**，儲存並等待部署完成。

預期網站位址為 `https://justinrhhsu.github.io/e-acupuncture/`；分支推送本身不代表 Pages 已啟用或網址已可用。

更新本目錄並提交到 `main` 後，可從專案根目錄執行以下命令，以本目錄內容建立下一個發布提交，無須安裝 `git subtree`：

```sh
git fetch origin gh-pages
pages_tree=$(git rev-parse HEAD:prototypes/hand-guide)
pages_commit=$(git commit-tree "$pages_tree" -p origin/gh-pages -m "Update hand-guide site")
git push origin "$pages_commit":gh-pages
```

發布分支僅用來部署，由 `main` 中的本目錄作為來源。更新前請確認遠端變更；不使用強制推送。
