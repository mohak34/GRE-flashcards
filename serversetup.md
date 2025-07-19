# Server Setup Documentation

## Overview
This document describes the complete setup of a production-ready server infrastructure on Oracle Cloud with VPN, Docker containers, reverse proxy, and SSL certificates.

## Server Information
- **Provider:** Oracle Cloud (Free Tier)
- **Instance Type:** Ubuntu
- **Public IP:** 89.168.89.176
- **Domain:** cooperelixer.tech (managed through Cloudflare)
- **User:** ubuntu

## 1. VPN Server Setup (StrongSwan IKEv2)

### Installation & Configuration
- **Software:** StrongSwan IKEv2 VPN server
- **Configuration Files:**
  - `/etc/ipsec.conf` - Main VPN configuration
  - `/etc/ipsec.secrets` - User authentication credentials
  - `/etc/strongswan.d/charon.conf` - VPN daemon settings

### Multi-User Authentication
The VPN supports multiple simultaneous users with individual credentials stored in `/etc/ipsec.secrets`:
```
: RSA "server-key.pem"
user1 : EAP "password1"
user2 : EAP "password2"
```

### Critical Oracle Cloud Fix
Oracle Cloud blocks VPN traffic by default with iptables rules. Created a systemd service to automatically remove these blocking rules on boot:

**File:** `/etc/systemd/system/fix-oracle-iptables.service`
```ini
[Unit]
Description=Fix Oracle Cloud iptables for VPN
After=network.target

[Service]
Type=oneshot
ExecStart=/sbin/iptables -I INPUT -p udp --dport 500 -j ACCEPT
ExecStart=/sbin/iptables -I INPUT -p udp --dport 4500 -j ACCEPT
ExecStart=/sbin/iptables -I FORWARD -m state --state RELATED,ESTABLISHED -j ACCEPT
ExecStart=/sbin/iptables -I FORWARD -s 10.10.10.0/24 -j ACCEPT
ExecStart=/sbin/iptables -I FORWARD -d 10.10.10.0/24 -j ACCEPT
ExecStart=/sbin/iptables -t nat -I POSTROUTING -s 10.10.10.0/24 -o ens3 -j MASQUERADE
RemainAfterExit=true

[Install]
WantedBy=multi-user.target
```

**Enabled with:** `sudo systemctl enable fix-oracle-iptables.service`

### VPN Network Configuration
- **VPN Subnet:** 10.10.10.0/24
- **DNS:** Cloudflare (1.1.1.1, 1.0.0.1)
- **Ports:** 500/UDP, 4500/UDP

### Oracle Cloud Security List
Added ingress rules for:
- UDP 500 (IKE)
- UDP 4500 (IPSec NAT-T)
- TCP 80 (HTTP)
- TCP 443 (HTTPS)
- TCP 22 (SSH)

## 2. Firewall Configuration (UFW)

### UFW Rules
```bash
sudo ufw allow OpenSSH
sudo ufw allow 80,443/tcp
sudo ufw allow 500,4500/udp
sudo ufw enable
```

### Current UFW Status
```
To                         Action      From
--                         ------      ----
OpenSSH                    ALLOW       Anywhere
80,443/tcp                 ALLOW       Anywhere
500,4500/udp               ALLOW       Anywhere
```

## 3. Docker Infrastructure

### Installation
- **Docker:** Latest version with Docker Compose plugin
- **Docker Compose:** Used as `docker compose` (not `docker-compose`)
- **User:** ubuntu added to docker group

### Docker Daemon Configuration
**File:** `/etc/docker/daemon.json`
```json
{
  "log-driver": "json-file",
  "log-opts": {
    "max-size": "10m",
    "max-file": "3"
  }
}
```

### Directory Structure
```
~/docker-apps/
├── docker-compose.yml          # Main infrastructure
├── traefik/
│   └── acme.json              # SSL certificates (chmod 600)
└── dockge/
    ├── data/                  # Dockge application data
    └── stacks/                # Dockge stack configurations

/opt/stacks/                   # Dockge creates stacks here
└── [stack-name]/
    └── [volumes]              # Stack-specific volumes
```

## 4. Traefik Reverse Proxy

### Purpose
- Routes traffic to services based on domain names
- Handles SSL certificate generation (Let's Encrypt)
- Provides monitoring dashboard
- Enables professional URL structure

### Configuration
- **Container:** traefik:v3.0
- **Ports:** 80 (HTTP), 443 (HTTPS)
- **Dashboard:** https://manage.cooperelixer.tech
- **Authentication:** Basic auth (admin/admin)

### Key Features
- **Automatic SSL:** Let's Encrypt certificates with HTTP challenge
- **HTTPS Redirect:** All HTTP traffic redirected to HTTPS
- **Docker Integration:** Automatically discovers services via Docker labels
- **Health Monitoring:** Built-in dashboard for service status

### Labels for Service Integration
```yaml
labels:
  - "traefik.enable=true"
  - "traefik.http.routers.SERVICE.rule=Host(`subdomain.cooperelixer.tech`)"
  - "traefik.http.routers.SERVICE.entrypoints=websecure"
  - "traefik.http.routers.SERVICE.tls.certresolver=cloudflare"
  - "traefik.http.services.SERVICE.loadbalancer.server.port=PORT"
```

## 5. Dockge Container Management

### Purpose
- Web-based Docker container management
- Easy deployment of new services
- Visual monitoring of container logs
- Edit docker-compose files through web interface

### Configuration
- **Container:** louislam/dockge:1
- **Port:** 5001 (internal)
- **URL:** https://dockge.cooperelixer.tech
- **Authentication:** Setup required on first visit

### Stack Deployment Process
1. Access Dockge web interface
2. Create new stack with docker-compose configuration
3. Add Traefik labels for routing
4. Deploy through web interface
5. Files are created in `/opt/stacks/[stack-name]/`

## 6. DNS Configuration (Cloudflare)

### Current DNS Records
| Type | Name | Content | Proxy Status |
|------|------|---------|-------------|
| A | manage | 89.168.89.176 | DNS only |
| A | dockge | 89.168.89.176 | DNS only |
| A | testdockge | 89.168.89.176 | DNS only |

### Important Notes
- **Proxy Status:** Always use "DNS only" (grey cloud) for services behind Traefik
- **SSL Certificates:** Handled by Let's Encrypt, not Cloudflare
- **New Services:** Add A record pointing to 89.168.89.176 for each new subdomain

## 7. Current Services

### Infrastructure Services
1. **Traefik** - Reverse proxy and SSL manager
   - URL: https://manage.cooperelixer.tech
   - Login: admin/admin
   - Status: Running

2. **Dockge** - Container management
   - URL: https://dockge.cooperelixer.tech
   - Status: Running
   - Setup: Required on first visit

### Test Services
1. **Test Website** - Static HTML site
   - URL: https://testdockge.cooperelixer.tech
   - Stack: testdockge
   - Content: `/opt/stacks/testdockge/html/index.html`

## 8. Main Docker Compose Configuration

**File:** `~/docker-apps/docker-compose.yml`
```yaml
version: '3.8'

services:
  traefik:
    image: traefik:v3.0
    container_name: traefik
    restart: unless-stopped
    command:
      - --api.dashboard=true
      - --api.insecure=false
      - --providers.docker=true
      - --providers.docker.exposedbydefault=false
      - --entrypoints.web.address=:80
      - --entrypoints.websecure.address=:443
      - --entrypoints.web.http.redirections.entrypoint.to=websecure
      - --entrypoints.web.http.redirections.entrypoint.scheme=https
      - --entrypoints.web.http.redirections.entrypoint.permanent=true
      - --certificatesresolvers.cloudflare.acme.tlschallenge=true
      - --certificatesresolvers.cloudflare.acme.email=mohaks0408@gmail.com
      - --certificatesresolvers.cloudflare.acme.storage=/letsencrypt/acme.json
      - --certificatesresolvers.cloudflare.acme.httpchallenge=true
      - --certificatesresolvers.cloudflare.acme.httpchallenge.entrypoint=web
      - --global.checknewversion=false
      - --global.sendanonymoususage=false
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock:ro
      - ./traefik/acme.json:/letsencrypt/acme.json
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.traefik.rule=Host(`manage.cooperelixer.tech`)"
      - "traefik.http.routers.traefik.entrypoints=websecure"
      - "traefik.http.routers.traefik.tls.certresolver=cloudflare"
      - "traefik.http.routers.traefik.service=api@internal"
      - "traefik.http.middlewares.traefik-auth.basicauth.users=admin:$$2y$$05$$H4FswsK0h2j1b7KUmULLvO4j97GmhBrjh1DVWxigkprH/3CADU2zS"
      - "traefik.http.routers.traefik.middlewares=traefik-auth"

  dockge:
    image: louislam/dockge:1
    container_name: dockge
    restart: unless-stopped
    volumes:
      - /var/run/docker.sock:/var/run/docker.sock
      - ./dockge/data:/app/data
      - ./dockge/stacks:/opt/stacks
    environment:
      - DOCKGE_STACKS_DIR=/opt/stacks
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.dockge.rule=Host(`dockge.cooperelixer.tech`)"
      - "traefik.http.routers.dockge.entrypoints=websecure"
      - "traefik.http.routers.dockge.tls.certresolver=cloudflare"
      - "traefik.http.routers.dockge.service=dockge"
      - "traefik.http.services.dockge.loadbalancer.server.port=5001"

networks:
  default:
    name: traefik
```

## 9. Deployment Workflows

### Adding New Services via Dockge
1. **DNS Setup:** Add A record in Cloudflare
2. **Dockge Access:** Go to https://dockge.cooperelixer.tech
3. **Create Stack:** New stack with docker-compose configuration
4. **Add Labels:** Include Traefik routing labels
5. **Deploy:** Click deploy button
6. **File Management:** Files go to `/opt/stacks/[stack-name]/`

### Adding New Services via Docker Compose
1. **DNS Setup:** Add A record in Cloudflare
2. **Configuration:** Edit `~/docker-apps/docker-compose.yml`
3. **Deploy:** Run `docker compose up -d`
4. **Files:** Managed in `~/docker-apps/`

### SSL Certificate Process
1. **DNS Resolution:** Ensure domain resolves to server IP
2. **Let's Encrypt:** Traefik automatically requests certificates
3. **Validation:** HTTP challenge validates domain ownership
4. **Storage:** Certificates stored in `./traefik/acme.json`
5. **Renewal:** Automatic renewal before expiration

## 10. Troubleshooting Common Issues

### VPN Not Working
- Check Oracle iptables: `sudo iptables -L -n`
- Verify systemd service: `sudo systemctl status fix-oracle-iptables`
- Check VPN logs: `sudo journalctl -u strongswan`

### SSL Certificate Errors
- Check DNS resolution: `nslookup domain.cooperelixer.tech`
- Verify Traefik logs: `docker logs traefik`
- Check rate limits: Let's Encrypt has rate limits for failed attempts

### Service Not Accessible
- Verify container is running: `docker ps`
- Check Traefik routing: `docker logs traefik | grep servicename`
- Verify DNS record exists and points to correct IP
- Check Oracle Cloud security list rules

### Dockge File Permissions
- Dockge creates files in `/opt/stacks/[stack-name]/`
- May need to adjust ownership: `sudo chown -R ubuntu:ubuntu /opt/stacks/stack-name/`

## 11. Next.js Deployment Options

### Static Next.js Deployment
```yaml
services:
  nextjs-static:
    image: nginx:alpine
    restart: unless-stopped
    volumes:
      - ./dist:/usr/share/nginx/html
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nextjs-static.rule=Host(`nextjs.cooperelixer.tech`)"
      - "traefik.http.routers.nextjs-static.entrypoints=websecure"
      - "traefik.http.routers.nextjs-static.tls.certresolver=cloudflare"
      - "traefik.http.services.nextjs-static.loadbalancer.server.port=80"
```

### Full Next.js with SSR
```yaml
services:
  nextjs-full:
    image: node:18-alpine
    restart: unless-stopped
    working_dir: /app
    volumes:
      - ./app:/app
      - /app/node_modules
    command: sh -c "npm install && npm run build && npm start"
    environment:
      - NODE_ENV=production
      - PORT=3000
    labels:
      - "traefik.enable=true"
      - "traefik.http.routers.nextjs-full.rule=Host(`nextjs.cooperelixer.tech`)"
      - "traefik.http.routers.nextjs-full.entrypoints=websecure"
      - "traefik.http.routers.nextjs-full.tls.certresolver=cloudflare"
      - "traefik.http.services.nextjs-full.loadbalancer.server.port=3000"
```

## 12. Security Considerations

### Current Security Measures
- **SSH:** Key-based authentication, root login disabled
- **Firewall:** UFW enabled with minimal required ports
- **SSL:** All services use HTTPS with valid certificates
- **VPN:** Encrypted traffic with user authentication
- **Docker:** Containers run as non-root where possible

### Additional Security Recommendations
- Regular system updates: `sudo apt update && sudo apt upgrade`
- Monitor logs: `sudo journalctl -f`
- Backup configurations regularly
- Use strong passwords for all services
- Consider implementing fail2ban for SSH protection

## 13. Backup Strategy

### Important Files to Backup
- `/etc/ipsec.conf` - VPN configuration
- `/etc/ipsec.secrets` - VPN user credentials
- `~/docker-apps/docker-compose.yml` - Main infrastructure
- `~/docker-apps/traefik/acme.json` - SSL certificates
- `/opt/stacks/` - All Dockge deployed services

### Backup Commands
```bash
# Create backup directory
sudo mkdir -p /backup

# Backup VPN configuration
sudo cp /etc/ipsec.conf /backup/
sudo cp /etc/ipsec.secrets /backup/

# Backup Docker configurations
sudo cp -r ~/docker-apps /backup/
sudo cp -r /opt/stacks /backup/

# Create tar archive
sudo tar -czf /backup/server-backup-$(date +%Y%m%d).tar.gz /backup/
```

## 14. Monitoring and Maintenance

### Regular Maintenance Tasks
- **System Updates:** Weekly `sudo apt update && sudo apt upgrade`
- **Docker Cleanup:** Monthly `docker system prune`
- **Log Rotation:** Configured in docker daemon.json
- **SSL Renewal:** Automatic via Traefik
- **Backup Verification:** Monthly backup testing

### Monitoring Commands
```bash
# Check system resources
htop
df -h

# Monitor Docker containers
docker ps
docker stats

# Check service logs
docker logs traefik
docker logs dockge
sudo journalctl -u strongswan

# Check network connectivity
ping 8.8.8.8
curl -I https://manage.cooperelixer.tech
```

## 15. Future Expansion Possibilities

### Potential Services to Add
- **WordPress:** Blog/CMS platform
- **Nextcloud:** File storage and sharing
- **Grafana:** Monitoring dashboard
- **PostgreSQL:** Database for applications
- **Redis:** Caching layer
- **GitLab:** Code repository and CI/CD

### Scaling Considerations
- Oracle Cloud free tier has resource limits
- Consider upgrading to paid tier for more resources
- Load balancing for high-traffic applications
- Database optimization for multiple services

This documentation provides a complete overview of the server setup and should enable any AI assistant to understand and help troubleshoot the infrastructure.