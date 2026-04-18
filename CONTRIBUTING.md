# 🤝 Contributing Guide - Group 122

මේ guide එක follow කරලා ඔයාගේ changes GitHub එකට commit කරන්න.

## 📋 Prerequisites

- Git installed
- GitHub account
- Repository access (collaborator විදිහට add වෙලා තියෙන්න ඕන)

---

## 🚀 First Time Setup (එක පාරක් විතරක්)

### 1. Git Configure කරන්න

```bash
git config --global user.name "Your Name"
git config --global user.email "your.email@my.sliit.lk"
```

### 2. Repository Clone කරන්න

```bash
git clone https://github.com/Umindu-Nimsara/Restaurant_Management_122.git
cd Restaurant_Management_122
```

### 3. Dependencies Install කරන්න

Frontend:
```bash
cd frontend
npm install
cd ..
```

Backend:
```bash
cd server
npm install
cd ..
```

---

## 💻 Daily Workflow (හැම වෙලාවෙම)

### Step 1: Latest Changes Pull කරන්න

```bash
# Main branch එකට switch වෙන්න
git checkout main

# Latest changes download කරන්න
git pull origin main
```

### Step 2: ඔයාගේ Changes කරන්න

Files edit කරන්න, code ලියන්න...

### Step 3: Changes Check කරන්න

```bash
# මොනවද change වෙලා තියෙන්නේ බලන්න
git status

# Specific file එකක changes බලන්න
git diff filename.js
```

### Step 4: Files Add කරන්න

```bash
# Specific files add කරන්න (Recommended)
git add path/to/your/file.js
git add path/to/another/file.jsx

# හෝ සියලුම changes add කරන්න
git add .
```

### Step 5: Commit කරන්න

```bash
git commit -m "Your descriptive message here"
```

**Good Commit Messages:**
```bash
git commit -m "Add user authentication feature"
git commit -m "Fix dashboard loading issue"
git commit -m "Update menu item validation"
```

### Step 6: GitHub එකට Push කරන්න

```bash
git push origin main
```

---

## 📁 Module-wise File Locations

### Dashboard Module (Umindu's Part)
```
frontend/app/(app)/modules/admin/dashboard/page.js
frontend/lib/dashboardService.js
frontend/components/ui/RevenueAnalytics.jsx
server/src/controllers/dashboard/dashboard.controller.js
server/src/routes/dashboard.routes.js
```

**Commit Example:**
```bash
cd Restaurant_Management_122
git pull origin main
git add frontend/app/(app)/modules/admin/dashboard/page.js
git add frontend/lib/dashboardService.js
git commit -m "Update dashboard analytics display"
git push origin main
```

### Menu Management Module (Umindu's Part)
```
frontend/app/(app)/modules/admin/menu-management/page.js
frontend/app/(app)/modules/admin/menu-management/add-menu-item/
frontend/lib/menuService.js
frontend/components/ui/MenuAnalytics.jsx
frontend/components/ui/MenuViewDialog.jsx
server/src/controllers/menu/menuItem.controller.js
server/src/controllers/menu/category.controller.js
server/src/routes/menu.routes.js
server/src/models/MenuItem.model.js
server/src/models/Category.model.js
```

**Commit Example:**
```bash
git pull origin main
git add frontend/app/(app)/modules/admin/menu-management/page.js
git add frontend/lib/menuService.js
git add server/src/controllers/menu/menuItem.controller.js
git commit -m "Add menu item filtering feature"
git push origin main
```

### Inventory Management Module
```
frontend/app/(app)/modules/admin/inventory-management/page.js
frontend/app/(app)/modules/admin/inventory-management/add-inventory-item/
server/src/controllers/inventory/ingredient.controller.js
server/src/controllers/inventory/stock.controller.js
server/src/routes/inventory.routes.js
server/src/models/Ingredient.model.js
server/src/models/StockMovement.model.js
```

### Order Management Module
```
frontend/app/(app)/modules/admin/order-management/page.js
frontend/app/(app)/modules/admin/order-management/add-order/page.jsx
frontend/lib/orderService.js
server/src/controllers/orders/order.controller.js
server/src/routes/order.routes.js
server/src/models/Order.model.js
```

### Supplier Management Module
```
frontend/app/(app)/modules/admin/supplier-management/page.js
frontend/app/(app)/modules/admin/supplier-management/add/page.js
frontend/components/ui/SupplierFormClient.jsx
server/src/controllers/suppliers/supplier.controller.js
server/src/routes/supplier.routes.js
server/src/models/Supplier.model.js
```

### User Management Module
```
frontend/app/(app)/modules/admin/users/page.js
frontend/lib/userService.js
server/src/controllers/users/user.controller.js
server/src/routes/user.routes.js
server/src/models/User.model.js
```

### Table Management Module
```
frontend/app/(app)/modules/admin/table-management/page.js
frontend/lib/tableService.js
server/src/controllers/tables/table.controller.js
server/src/routes/table.routes.js
server/src/models/Table.model.js
```

### Chef Module
```
frontend/app/(app)/modules/chef/page.jsx
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: "Permission denied"
```bash
# Solution: Repository access නැහැ
# Admin කෙනෙක්ට කියන්න collaborator විදිහට add කරන්න
```

### Issue 2: "Merge conflict"
```bash
# Solution: Latest changes pull කරලා නැහැ
git pull origin main
# Conflicts resolve කරන්න
git add .
git commit -m "Resolve merge conflicts"
git push origin main
```

### Issue 3: "Changes not showing"
```bash
# Files add කරලා නැහැ
git add path/to/file.js
git commit -m "Your message"
git push origin main
```

### Issue 4: "Wrong commit message"
```bash
# Last commit message change කරන්න (push කරන්න කලින්)
git commit --amend -m "New correct message"
git push origin main
```

---

## 🔒 Security Rules

### ❌ කවදාවත් Commit කරන්න එපා:

1. **node_modules/** folder
2. **.env** files with real passwords
3. **.next/** build files
4. **Personal API keys** or **passwords**
5. **Database credentials**

### ✅ Commit කරන්න පුළුවන්:

1. Source code files (.js, .jsx, .css)
2. Configuration files (package.json, next.config.js)
3. Documentation files (.md)
4. **.env.example** (without real values)

---

## 📝 Quick Reference Commands

```bash
# Status check කරන්න
git status

# Latest changes pull කරන්න
git pull origin main

# Files add කරන්න
git add filename.js

# Commit කරන්න
git commit -m "Your message"

# Push කරන්න
git push origin main

# Changes බලන්න
git diff

# Commit history බලන්න
git log --oneline

# Specific file එකක් undo කරන්න (commit කරන්න කලින්)
git checkout -- filename.js
```

---

## 🆘 Help Needed?

Problems තියෙනවා නම්:
1. මේ guide එක හොඳින් කියවන්න
2. Error message එක copy කරන්න
3. Team lead කෙනෙක්ට කියන්න
4. Google එකේ search කරන්න: "git [your error message]"

---

## 👥 Team Members

Add your name after your first commit:
- Umindu Nimsara (IT24100464) - Dashboard & Menu Management
- [Your Name] - [Your Module]
- [Your Name] - [Your Module]
- [Your Name] - [Your Module]

---

**Happy Coding! 🚀**
