# FireCommand VNext｜續作指南

1. 從分支 `feature/vnext-field-feedback` 最新 HEAD 接續，先看 `CURRENT_STATUS.md`、`TEST_RESULTS.md`，不要從遠端舊版 `main` 重做，也不要將 v33 的局部帳號管理更新包當成完整 VNext。
2. 本批關鍵檔案：`index.html`、`assets/app.js`、`assets/field-entry-core.js`、`assets/field-entry.css`、`assets/intake-core.js`、`assets/intake-semantic.js`、`firebase/firestore.rules` 與相關測試。
3. 安全邊界：`*.vercel.app` 非正式網域預設停用 Firebase，使用本機示範資料；目前無隔離 Preview Firebase，切勿以正式案件作測試。自訂 Preview 網域未涵蓋；新 Rules 尚未部署，勿稱已驗證。
4. 下一步先解照片規則與測試環境的授權選擇，再逐筆關係人與支援；待 UI／資料儲存跨模組回歸後做戰術圖。
5. Production 不合併、不部署、不改資料，待使用者確認隔離 Preview 與驗收結果。
6. 本輪 `git push` 因缺少 GitHub 寫入身分失敗。最新成果保存在本機功能分支，不能聲稱遠端已有這些 commit。取得正常授權後先查遠端是否已有同名分支及新 HEAD，再安全推送；勿 force push。
