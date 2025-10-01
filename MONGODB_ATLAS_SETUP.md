# MongoDB Atlas Setup Guide for PrintHub

## Steps to Switch from Local MongoDB to MongoDB Atlas

### 1. Create MongoDB Atlas Account
1. Go to [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Sign up for a free account or log in if you already have one
3. Choose the free tier (M0 Sandbox) for development

### 2. Create a New Cluster
1. Click "Create a New Cluster"
2. Choose your cloud provider (AWS, Google Cloud, or Azure)
3. Select a region close to your location
4. Choose M0 Sandbox (Free tier)
5. Name your cluster (e.g., "printhub-cluster")
6. Click "Create Cluster" (this may take a few minutes)

### 3. Configure Database Access
1. In your Atlas dashboard, go to "Database Access" in the left sidebar
2. Click "Add New Database User"
3. Choose "Password" authentication method
4. Create a username and secure password
5. For Database User Privileges, select "Read and write to any database"
6. Click "Add User"

**Important: Save these credentials safely!**

### 4. Configure Network Access
1. Go to "Network Access" in the left sidebar
2. Click "Add IP Address"
3. For development, you can click "Allow Access from Anywhere" (0.0.0.0/0)
4. For production, only add your specific IP addresses
5. Click "Confirm"

### 5. Get Your Connection String
1. Go to "Clusters" in the left sidebar
2. Click "Connect" on your cluster
3. Choose "Connect your application"
4. Select "Node.js" as driver and version 4.1 or later
5. Copy the connection string (it will look like this):
   ```
   mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/<database_name>?retryWrites=true&w=majority
   ```

### 6. Update Your Environment Variables

#### For Server (.env in server folder):
```bash
# MongoDB Atlas Configuration
MONGODB_URI=mongodb+srv://your-username:your-password@printhub-cluster.xxxxx.mongodb.net/printhub?retryWrites=true&w=majority
```

#### For Frontend (.env in root folder):
```bash
# MongoDB Configuration (for display purposes only - actual connection is server-side)
VITE_DATABASE_TYPE=MongoDB Atlas
```

### 7. Update Hard-coded Connection Strings
The following files have hard-coded MongoDB URLs that need to be updated:

1. **server/check-pending-jobs.js** - Line 4
2. **server/check-jobs.js** - Line 9

Replace the hard-coded URLs with:
```javascript
await mongoose.connect(process.env.MONGODB_URI);
```

### 8. Database Migration (Optional)
If you have existing data in your local MongoDB, you can migrate it:

1. **Export from local MongoDB:**
   ```bash
   mongodump --db PrintHub --out ./backup
   ```

2. **Import to MongoDB Atlas:**
   ```bash
   mongorestore --uri "mongodb+srv://username:password@cluster.mongodb.net/printhub" ./backup/PrintHub
   ```

### 9. Test the Connection
1. Update your server/.env file with the Atlas connection string
2. Start your server: `npm run dev` in the server folder
3. Check the console for: "📦 MongoDB Connected: printhub-cluster.xxxxx.mongodb.net"

### 10. Production Considerations
1. **Security**: Use environment-specific connection strings
2. **Backup**: Enable automated backups in Atlas
3. **Monitoring**: Set up alerts for connection issues
4. **Scaling**: Monitor your usage and upgrade when needed

### Benefits of MongoDB Atlas
- ✅ Managed database service (no maintenance)
- ✅ Automatic backups and point-in-time recovery
- ✅ Built-in security features
- ✅ Global clusters for better performance
- ✅ Real-time performance monitoring
- ✅ Easy scaling as your app grows

### Free Tier Limitations
- 512 MB storage
- Shared RAM and vCPU
- No backups (upgrade to M2+ for backups)
- Basic monitoring

### Environment Variables Summary
After setup, your server/.env should contain:
```bash
MONGODB_URI=mongodb+srv://your-username:your-password@printhub-cluster.xxxxx.mongodb.net/printhub?retryWrites=true&w=majority
```

**Remember to:**
- Never commit your actual connection string to git
- Use different clusters for development, staging, and production
- Regularly monitor your Atlas dashboard for performance metrics