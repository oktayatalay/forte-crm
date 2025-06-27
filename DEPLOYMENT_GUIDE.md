# Forte Panel Deployment Guide

## Files to Upload

### 1. Admin Management Pages
Upload these HTML files to your web root:
- `admin_settings_inline_form.html`
- `admin_users_with_departments.html`
- `admin_admins_inline_form.html`
- `admin_departments_inline_form.html`

### 2. API Files
Upload to `/api/admin/` directory:
- `settings.php`
- `system-info.php`
- `test-email.php`
- `users.php`
- `admins.php`
- `departments.php`

### 3. Database Updates
Run these SQL files on your database:
- `api/config/create_system_settings.sql`
- `api/config/add_department_to_users.sql` (if not already done)

## Deployment Steps

1. **Backup your current files**
   ```bash
   # Create backup of current admin files
   cp -r /path/to/current/admin /path/to/backup/admin_backup_$(date +%Y%m%d)
   ```

2. **Upload HTML files**
   - Upload the HTML files to your web root directory
   - Ensure file permissions are set correctly (644 for files)

3. **Upload API files**
   - Upload PHP files to the `/api/admin/` directory
   - Ensure PHP files have execute permissions (644)

4. **Database Updates**
   ```sql
   -- Run this in your MySQL console
   USE your_database_name;
   SOURCE /path/to/create_system_settings.sql;
   ```

5. **Test the deployment**
   - Visit: `https://forte.works/admin_settings_inline_form.html`
   - Test all CRUD operations
   - Verify API endpoints are working

## Post-Deployment Checklist

- [ ] Admin login works
- [ ] User management functions
- [ ] Department management functions  
- [ ] Admin management functions (super admin only)
- [ ] Settings page loads and saves
- [ ] System information displays correctly
- [ ] Email settings can be tested

## File Permissions
Ensure these permissions on your server:
- HTML files: 644
- PHP files: 644
- Directories: 755

## Database Connection
Verify `api/config/database.php` has correct credentials for your server.

## Troubleshooting
If you encounter issues:
1. Check PHP error logs
2. Verify database connection
3. Ensure all SQL tables were created
4. Check file permissions

## Security Notes
- Change default admin passwords
- Regularly update session tokens
- Monitor admin access logs
- Keep database credentials secure