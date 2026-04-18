# 🤝 සිංහල මාර්ගෝපදේශය - Group 122

## 🚀 පළමු වතාවට Setup කරන්නේ කොහොමද

### 1. Git Configure කරන්න

```bash
git config --global user.name "ඔයාගේ නම"
git config --global user.email "your.email@my.sliit.lk"
```

### 2. Project එක Download කරන්න

```bash
git clone https://github.com/Umindu-Nimsara/Restaurant_Management_122.git
cd Restaurant_Management_122
```

### 3. Dependencies Install කරන්න

```bash
# Frontend
cd frontend
npm install
cd ..

# Backend
cd server
npm install
cd ..
```

---

## 🌿 Branch Strategy (වැදගත්!)

Project එකේ branches:
- `main` - Production ready code (merge කරපු code)
- `dashboard` - Dashboard module (Umindu's part)
- `menu-management` - Menu Management module (Umindu's part)

**Note:** අනිත් modules (inventory, order, supplier, etc.) main branch එකේම වැඩ කරන්න පුළුවන්.

---

## 💻 හැම දවසම කරන්න ඕන දේවල් (Branch එකක වැඩ කරන විදිහ)

### 1️⃣ ඔයාගේ Branch එකට Switch වෙන්න

**Dashboard හෝ Menu Management වැඩ කරනවා නම්:**
```bash
# Dashboard module නම්
git checkout dashboard

# Menu module නම්
git checkout menu-management
```

**අනිත් modules (Inventory, Order, Supplier, etc.) නම්:**
```bash
# Main branch එකේම වැඩ කරන්න
git checkout main
```

**Branch එක නැත්නම් හදන්න (Dashboard/Menu විතරක්):**
```bash
# Dashboard branch එකක් හදන්න
git checkout -b dashboard

# Menu branch එකක් හදන්න
git checkout -b menu-management
```

### 2️⃣ Latest Changes ගන්න

**Dashboard/Menu branches නම්:**
```bash
# ඔයාගේ branch එකේ latest changes
git pull origin dashboard
# හෝ
git pull origin menu-management
```

**අනිත් modules නම්:**
```bash
# Main branch එකේ latest changes
git pull origin main
```

### 3️⃣ ඔයාගේ Files Edit කරන්න

ඔයාගේ module එකේ files edit කරන්න...

### 4️⃣ මොනවද Change වෙලා තියෙන්නේ බලන්න

```bash
git status
```

### 5️⃣ Files Add කරන්න

```bash
# ඔයා edit කළ files විතරක් add කරන්න (හොඳම විදිය)
git add frontend/app/dashboard/page.js
git add server/src/controllers/dashboard.controller.js

# හෝ සියල්ල add කරන්න
git add .
```

### 6️⃣ Commit කරන්න

```bash
git commit -m "Dashboard analytics update කළා"
```

### 7️⃣ Push කරන්න

**Dashboard/Menu modules නම්:**
```bash
# Dashboard branch එකට
git push origin dashboard

# Menu branch එකට
git push origin menu-management
```

**අනිත් modules නම්:**
```bash
# Main branch එකට directly
git push origin main
```

### 8️⃣ Pull Request හදන්න (Dashboard/Menu විතරක්)

**Dashboard හෝ Menu module නම් විතරක්:**
1. GitHub repository එකට යන්න
2. "Compare & pull request" button එක click කරන්න
3. Title එකක් දෙන්න: "Dashboard module completed"
4. Description එකක් ලියන්න
5. "Create pull request" click කරන්න
6. Team lead කෙනෙක් review කරලා merge කරයි

**අනිත් modules නම්:**
Pull request එකක් ඕන නැහැ - directly main එකට push වෙනවා.

---

## 📁 Module අනුව Files

### Dashboard (Umindu)
```bash
# Frontend files
git add frontend/app/(app)/modules/admin/dashboard/page.js
git add frontend/lib/dashboardService.js
git add frontend/components/ui/RevenueAnalytics.jsx

# Backend files
git add server/src/controllers/dashboard/dashboard.controller.js
git add server/src/routes/dashboard.routes.js

# Commit & Push
git commit -m "Dashboard update කළා"
git push origin main
```

### Menu Management (Umindu)
```bash
# Frontend files
git add frontend/app/(app)/modules/admin/menu-management/page.js
git add frontend/lib/menuService.js
git add frontend/components/ui/MenuAnalytics.jsx

# Backend files
git add server/src/controllers/menu/menuItem.controller.js
git add server/src/models/MenuItem.model.js

# Commit & Push
git commit -m "Menu management update කළා"
git push origin main
```

### Inventory Management
```bash
git add frontend/app/(app)/modules/admin/inventory-management/page.js
git add server/src/controllers/inventory/ingredient.controller.js
git commit -m "Inventory module update කළා"
git push origin main
```

### Order Management
```bash
git add frontend/app/(app)/modules/admin/order-management/page.js
git add server/src/controllers/orders/order.controller.js
git commit -m "Order management update කළා"
git push origin main
```

### Supplier Management
```bash
git add frontend/app/(app)/modules/admin/supplier-management/page.js
git add server/src/controllers/suppliers/supplier.controller.js
git commit -m "Supplier management update කළා"
git push origin main
```

### User Management
```bash
git add frontend/app/(app)/modules/admin/users/page.js
git add server/src/controllers/users/user.controller.js
git commit -m "User management update කළා"
git push origin main
```

### Table Management
```bash
git add frontend/app/(app)/modules/admin/table-management/page.js
git add server/src/controllers/tables/table.controller.js
git commit -m "Table management update කළා"
git push origin main
```

---

## ⚠️ Common Problems

### Problem 1: "Permission denied"
**හේතුව:** Repository access නැහැ  
**විසඳුම:** Admin කෙනෙක්ට කියන්න collaborator විදිහට add කරන්න

### Problem 2: "Merge conflict"
**හේතුව:** Latest changes pull කරලා නැහැ  
**විසඳුම:**
```bash
git pull origin main
# Conflicts fix කරන්න
git add .
git commit -m "Conflicts resolve කළා"
git push origin main
```

### Problem 3: Changes පෙන්නේ නැහැ
**විසඳුම:**
```bash
git add path/to/your/file.js
git commit -m "Your message"
git push origin main
```

---

## 🔒 මේවා Commit කරන්න එපා

❌ **කවදාවත් commit කරන්න එපා:**
- node_modules/ folder
- .env files (passwords තියෙන)
- .next/ folder
- Personal passwords හෝ API keys

✅ **Commit කරන්න පුළුවන්:**
- .js, .jsx files (ඔයාගේ code)
- .css files
- package.json
- README.md

---

## 📝 Quick Commands

```bash
# Status බලන්න
git status

# Latest changes ගන්න
git pull origin main

# File එකක් add කරන්න
git add filename.js

# Commit කරන්න
git commit -m "ඔයාගේ message එක"

# Upload කරන්න
git push origin main

# Changes බලන්න
git diff

# History බලන්න
git log --oneline
```

---

## 🎯 Complete Example

```bash
# 1. Latest changes ගන්න
git pull origin main

# 2. ඔයාගේ files edit කරන්න
# (VS Code එකේ හෝ editor එකේ)

# 3. Status check කරන්න
git status

# 4. Files add කරන්න
git add frontend/app/dashboard/page.js
git add server/src/controllers/dashboard.controller.js

# 5. Commit කරන්න
git commit -m "Dashboard analytics feature එකක් add කළා"

# 6. Push කරන්න
git push origin main
```

---

## 🆘 Help අවශ්‍ය නම්

1. මේ guide එක හොඳින් කියවන්න
2. Error message එක copy කරන්න
3. Team lead කෙනෙක්ට කියන්න
4. Google එකේ search කරන්න

---

**සුභ පැතුම්! 🚀**
