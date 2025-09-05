// KeyLink Presentation Script
class KeyLinkPresentation {
    constructor() {
        this.currentSlide = 0;
        this.totalSlides = 6;
        this.donatedAmount = 0;
        this.monthlyGoal = 7;
        this.usageLimit = 7; // $7 monthly limit
        this.currentUsage = 0;
        this.flyToken = 'fm2_lJPECAAAAAAACQ8TxBASbPzTS5DPUv+JjSDEq1VNwrVodHRwczovL2FwaS5mbHkuaW8vdjGWAJLOABE4XR8Lk7lodHRwczovL2FwaS5mbHkuaW8vYWFhL3YxxDw7RixwSLuoUGk4RxhA4DpsAN0RUzmKyFWPMYs2NaDM3VCnownMPwzF00pOXgsrJrPo/ByiccoIlOEpVbPETlE/JPxOcgj9eqHPk08fwsUNC38JawL6W643nTWEd1D06nzCodi89/h528bPWpyPlhQRHzncUMaGGUBAzRuBOWnj081ibZGk9mLjDg6VeQ2SlAORgc4Ae9vcHwWRgqdidWlsZGVyH6J3Zx8BxCBbMo1uvSb2uvDKr8Whq3eQmm3j7/P6lvFH7DiDC5ElIg==,fm2_lJPETlE/JPxOcgj9eqHPk08fwsUNC38JawL6W643nTWEd1D06nzCodi89/h528bPWpyPlhQRHzncUMaGGUBAzRuBOWnj081ibZGk9mLjDg6VecQQ+aLpWRqyjPjRRF4xe7yw8sO5aHR0cHM6Ly9hcGkuZmx5LmlvL2FhYS92MZgEks5oum9Dzmjh/GEXzgAQjT8Kkc4AEI0/DMQQNbS5MOmkqh+ii+f+Jk1cV8QgVnLlT7COaakFYf13o5eGFyEndYGFpnfJNPOJ3cxFNMg=';
        
        // Multiplayer features
        this.participants = new Map();
        this.participantCount = 0;
        this.cursorContainer = null;
        this.donationPromptTimer = null;
        this.usageCheckInterval = null;
        
        this.init();
    }
    
    init() {
        console.log('KeyLink Presentation Initializing...');
        this.setupEventListeners();
        this.updateProgress();
        this.createSlideIndicators();
        this.setupCircleOfFifths();
        this.setupMultiplayerFeatures();
        this.checkFlyUsage();
        this.loadDonationData();
        this.startUsageMonitoring();
        console.log('KeyLink Presentation Ready! 🎵');
    }
    
    setupEventListeners() {
        // Navigation
        document.querySelectorAll('.nav-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const slideIndex = parseInt(link.dataset.slide);
                this.goToSlide(slideIndex);
            });
        });
        
        // Slide controls
        document.getElementById('prevBtn').addEventListener('click', () => this.previousSlide());
        document.getElementById('nextBtn').addEventListener('click', () => this.nextSlide());
        
        // Donation buttons
        document.getElementById('donateBtn').addEventListener('click', () => this.openDonationModal());
        document.getElementById('donateLargeBtn').addEventListener('click', () => this.openDonationModal());
        
        // Donation options
        document.querySelectorAll('.donation-option').forEach(option => {
            option.addEventListener('click', () => {
                document.querySelectorAll('.donation-option').forEach(opt => opt.classList.remove('selected'));
                option.classList.add('selected');
                const amount = parseFloat(option.dataset.amount);
                document.getElementById('customAmount').value = amount;
            });
        });
        
        // PayPal button
        document.getElementById('paypalBtn').addEventListener('click', () => this.processDonation());
        
        // Quick donate button (Stripe)
        document.getElementById('quickDonateBtn').addEventListener('click', () => this.quickDonate());
        
        // Recurring donate button (Stripe)
        document.getElementById('recurringDonateBtn').addEventListener('click', () => this.recurringDonate());
        
        // Modal controls
        document.getElementById('closeModal').addEventListener('click', () => this.closeModal());
        document.getElementById('donateFromUsage').addEventListener('click', () => {
            this.closeModal();
            this.openDonationModal();
        });
        document.getElementById('checkLater').addEventListener('click', () => this.closeModal());
        
        // Info button
        document.getElementById('infoBtn').addEventListener('click', () => this.toggleInfo());
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') this.previousSlide();
            if (e.key === 'ArrowRight') this.nextSlide();
            if (e.key === 'Escape') this.closeModal();
        });
        
        // Click outside modal to close
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeModal();
            });
        });
    }
    
    createSlideIndicators() {
        const indicatorsContainer = document.getElementById('slideIndicators');
        
        for (let i = 0; i < this.totalSlides; i++) {
            const indicator = document.createElement('div');
            indicator.className = `indicator ${i === 0 ? 'active' : ''}`;
            indicator.addEventListener('click', () => this.goToSlide(i));
            indicatorsContainer.appendChild(indicator);
        }
    }
    
    goToSlide(index) {
        if (index < 0 || index >= this.totalSlides) return;
        
        // Hide current slide
        document.querySelector('.slide.active').classList.remove('active');
        document.querySelector('.nav-link.active').classList.remove('active');
        document.querySelector('.indicator.active').classList.remove('active');
        
        // Show new slide
        document.getElementById(`slide-${index}`).classList.add('active');
        document.querySelector(`[data-slide="${index}"]`).classList.add('active');
        document.querySelectorAll('.indicator')[index].classList.add('active');
        
        this.currentSlide = index;
        
        // Special handling for demo slide
        if (index === 3) {
            this.animateCircleOfFifths();
        }
    }
    
    nextSlide() {
        const nextIndex = (this.currentSlide + 1) % this.totalSlides;
        this.goToSlide(nextIndex);
    }
    
    previousSlide() {
        const prevIndex = this.currentSlide === 0 ? this.totalSlides - 1 : this.currentSlide - 1;
        this.goToSlide(prevIndex);
    }
    
    setupCircleOfFifths() {
        const notes = document.querySelectorAll('.note');
        const currentKey = document.getElementById('currentKey');
        const currentMode = document.getElementById('currentMode');
        
        notes.forEach(note => {
            note.addEventListener('click', () => {
                const noteName = note.dataset.note;
                currentKey.textContent = noteName;
                
                // Simulate mode change
                const modes = ['Major', 'Minor', 'Dorian', 'Mixolydian'];
                const randomMode = modes[Math.floor(Math.random() * modes.length)];
                currentMode.textContent = randomMode;
                
                // Visual feedback
                notes.forEach(n => n.style.background = 'rgba(255, 255, 255, 0.2)');
                note.style.background = 'rgba(76, 175, 80, 0.6)';
                
                // Simulate network sync
                this.simulateNetworkSync(noteName, randomMode);
            });
        });
    }
    
    animateCircleOfFifths() {
        const notes = document.querySelectorAll('.note');
        let index = 0;
        
        const animate = () => {
            notes.forEach(n => n.style.background = 'rgba(255, 255, 255, 0.2)');
            notes[index].style.background = 'rgba(76, 175, 80, 0.6)';
            
            const noteName = notes[index].dataset.note;
            document.getElementById('currentKey').textContent = noteName;
            
            index = (index + 1) % notes.length;
        };
        
        // Clear any existing animation
        if (this.circleAnimation) clearInterval(this.circleAnimation);
        
        // Start animation
        this.circleAnimation = setInterval(animate, 1000);
        
        // Stop after 10 seconds
        setTimeout(() => {
            if (this.circleAnimation) clearInterval(this.circleAnimation);
        }, 10000);
    }
    
    simulateNetworkSync(key, mode) {
        // Simulate network delay
        setTimeout(() => {
            console.log(`Network sync: ${key} ${mode} propagated to all devices`);
            
            // Show sync indicator
            this.showSyncIndicator();
        }, Math.random() * 500 + 100);
    }
    
    showSyncIndicator() {
        const indicator = document.createElement('div');
        indicator.className = 'sync-indicator';
        indicator.innerHTML = '<i class="fas fa-sync-alt"></i> Synced';
        indicator.style.cssText = `
            position: fixed;
            top: 100px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 0.5rem 1rem;
            border-radius: 25px;
            font-size: 0.9rem;
            font-weight: 600;
            z-index: 1000;
            animation: slideInRight 0.3s ease;
        `;
        
        document.body.appendChild(indicator);
        
        setTimeout(() => {
            indicator.style.animation = 'slideOutRight 0.3s ease';
            setTimeout(() => indicator.remove(), 300);
        }, 2000);
    }
    
    openDonationModal() {
        document.getElementById('donationModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    closeModal() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.classList.remove('show');
        });
        document.body.style.overflow = 'auto';
    }
    
    processDonation() {
        const amount = parseFloat(document.getElementById('customAmount').value);
        
        if (!amount || amount <= 0) {
            alert('Please enter a valid donation amount');
            return;
        }
        
        // Redirect to PayPal donation page
        const paypalUrl = `https://www.paypal.com/donate/?business=WMLNUNEFCS62S&no_recurring=0&item_name=KeyLink+Development+Support%E2%80%94Help+us+keep+the+global+music+collaboration+alive%21+%F0%9F%8E%B6&currency_code=USD&amount=${amount}`;
        window.open(paypalUrl, '_blank');
        
        // Track donation locally for demo purposes
        this.simulateDonation(amount);
    }
    
    quickDonate() {
        // Redirect to Stripe for $7 one-time donation
        const stripeUrl = 'https://checkout.stripe.com/c/pay/cs_live_a1d5r6JK7LPSqoMoCbvcer9ZPXVDoobRwIDEYB4HL0efVRIm2LFgcT27d9#fidkdWxOYHwnPyd1blppbHNgWjA0V0M2MVREMW4ybUhTTTB1aXAxcUxvcW5PU0JwSkg9U3xIT0FOQm0za2JORkFNT1ZIZnNnZ0htQ11zUTZHQHxRXWBzcF9jaDBGYmFAQ2Fnd2JGbHdsTFZANTVoNUwyVTViYCcpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl';
        window.open(stripeUrl, '_blank');
        
        // Track donation locally for demo purposes
        this.simulateDonation(7);
    }
    
    recurringDonate() {
        // Redirect to Stripe for $5/month recurring donation
        const stripeUrl = 'https://checkout.stripe.com/c/pay/cs_live_a1o575131IqIhfwqiD8KkqKVkYSnvo3IA3uB161amM0BLvnzzBTn4bVpPq#fidkdWxOYHwnPyd1blppbHNgWjA0V0M2MVREMW4ybUhTTTB1aXAxcUxvcW5PU0JwSkg9U3xIT0FOQm0za2JORkFNT1ZIZnNnZ0htQ11zUTZHQHxRXWBzcF9jaDBGYmFAQ2Fnd2JGbHdsTFZANTVoNUwyVTViYCcpJ2N3amhWYHdzYHcnP3F3cGApJ2lkfGpwcVF8dWAnPyd2bGtiaWBabHFgaCcpJ2BrZGdpYFVpZGZgbWppYWB3dic%2FcXdwYHgl';
        window.open(stripeUrl, '_blank');
        
        // Show recurring donation message
        this.showRecurringDonationMessage();
    }
    
    simulateDonation(amount) {
        // In a real implementation, this would redirect to PayPal
        // For demo purposes, we'll simulate the donation
        
        this.donatedAmount += amount;
        this.updateProgress();
        this.saveDonationData();
        
        // Show success message
        this.showDonationSuccess(amount);
        
        // Close modal
        this.closeModal();
        
        // Check if goal is reached
        if (this.donatedAmount >= this.monthlyGoal) {
            this.showGoalReached();
        }
    }
    
    showDonationSuccess(amount) {
        const message = document.createElement('div');
        message.className = 'success-message';
        message.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <h3>Thank you for your donation!</h3>
            <p>Your $${amount.toFixed(2)} donation helps keep KeyLink running</p>
        `;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => message.remove(), 300);
        }, 3000);
    }
    
    showRecurringDonationMessage() {
        const message = document.createElement('div');
        message.className = 'recurring-message';
        message.innerHTML = `
            <i class="fas fa-sync-alt"></i>
            <h3>Thank you for your recurring support!</h3>
            <p>Your $5/month donation ensures KeyLink stays online and helps fuel Phewsh's mission of crafting timeless tools for humanity's evolving needs.</p>
        `;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            animation: fadeIn 0.3s ease;
            max-width: 500px;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => message.remove(), 5000);
        }, 5000);
    }
    
    showGoalReached() {
        const message = document.createElement('div');
        message.className = 'goal-message';
        message.innerHTML = `
            <i class="fas fa-trophy"></i>
            <h3>Monthly Goal Reached!</h3>
            <p>Thank you for supporting KeyLink! The global public lobby is fully funded for this month.</p>
        `;
        message.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: linear-gradient(135deg, #4CAF50, #45a049);
            color: white;
            padding: 2rem;
            border-radius: 15px;
            text-align: center;
            box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
            z-index: 3000;
            animation: fadeIn 0.3s ease;
        `;
        
        document.body.appendChild(message);
        
        setTimeout(() => {
            message.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => message.remove(), 5000);
        }, 5000);
    }
    
    updateProgress() {
        const percentage = Math.min((this.donatedAmount / this.monthlyGoal) * 100, 100);
        
        document.getElementById('progressFill').style.width = `${percentage}%`;
        document.getElementById('progressFillLarge').style.width = `${percentage}%`;
        document.getElementById('progressText').textContent = `$${this.donatedAmount.toFixed(2)} / $${this.monthlyGoal}`;
        document.getElementById('currentAmount').textContent = `$${this.donatedAmount.toFixed(2)}`;
        document.getElementById('goalAmount').textContent = `/ $${this.monthlyGoal}`;
    }
    
    async checkFlyUsage() {
        try {
            // Check Fly.io usage with your token
            const response = await fetch('https://api.fly.io/v1/apps', {
                headers: {
                    'Authorization': `Bearer ${this.flyToken}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (response.ok) {
                const apps = await response.json();
                // Find your KeyLink app and get usage data
                const keylinkApp = apps.data.find(app => app.name.includes('keylink') || app.name.includes('KeyLink'));
                
                if (keylinkApp) {
                    // Get billing/usage info
                    const usageResponse = await fetch(`https://api.fly.io/v1/apps/${keylinkApp.id}/billing`, {
                        headers: {
                            'Authorization': `Bearer ${this.flyToken}`,
                            'Content-Type': 'application/json'
                        }
                    });
                    
                    if (usageResponse.ok) {
                        const billing = await usageResponse.json();
                        this.currentUsage = billing.total_amount || 0;
                        
                        // Check if we've exceeded $7
                        if (this.currentUsage > this.usageLimit) {
                            this.showUsageModal();
                        }
                    }
                }
            }
        } catch (error) {
            console.log('Fly.io API not accessible, using fallback');
            // Fallback to simulated usage for demo
            this.currentUsage = Math.floor(Math.random() * 10); // Random between 0-10 for demo
        }
    }
    
    showUsageModal() {
        document.getElementById('usageModal').classList.add('show');
        document.body.style.overflow = 'hidden';
    }
    
    toggleInfo() {
        const infoContent = document.getElementById('infoContent');
        infoContent.classList.toggle('show');
    }
    
    loadDonationData() {
        // Load from localStorage
        const saved = localStorage.getItem('keylinkDonations');
        if (saved) {
            const data = JSON.parse(saved);
            this.donatedAmount = data.amount || 0;
            this.updateProgress();
        }
    }
    
    saveDonationData() {
        // Save to localStorage
        const data = {
            amount: this.donatedAmount,
            lastUpdated: new Date().toISOString()
        };
        localStorage.setItem('keylinkDonations', JSON.stringify(data));
    }
    
    // Multiplayer Features
    setupMultiplayerFeatures() {
        // Create cursor container
        this.cursorContainer = document.createElement('div');
        this.cursorContainer.id = 'cursor-container';
        this.cursorContainer.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            pointer-events: none;
            z-index: 1000;
        `;
        document.body.appendChild(this.cursorContainer);
        
        // Create participant counter
        this.participantCounter = document.createElement('div');
        this.participantCounter.id = 'participant-counter';
        this.participantCounter.style.cssText = `
            position: fixed;
            bottom: 20px;
            left: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: #F5C242;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 14px;
            font-weight: 600;
            z-index: 1001;
            display: flex;
            align-items: center;
            gap: 8px;
        `;
        document.body.appendChild(this.participantCounter);
        
        // Simulate participants for demo
        this.simulateParticipants();
        
        // Debug: Log that multiplayer features are loaded
        console.log('KeyLink Multiplayer Features Loaded! 🎵');
    }
    
    simulateParticipants() {
        // Simulate 3-8 participants for demo
        const participantCount = Math.floor(Math.random() * 6) + 3;
        
        for (let i = 0; i < participantCount; i++) {
            this.addParticipant(`user_${i}`, {
                name: `Musician ${i + 1}`,
                color: this.getRandomColor(),
                lastActivity: Date.now()
            });
        }
        
        this.updateParticipantCounter();
        this.animateCursors();
    }
    
    addParticipant(id, data) {
        this.participants.set(id, {
            ...data,
            cursor: this.createCursor(id, data.color),
            lastMove: Date.now()
        });
        this.participantCount = this.participants.size;
    }
    
    createCursor(id, color) {
        const cursor = document.createElement('div');
        cursor.className = 'participant-cursor';
        cursor.style.cssText = `
            position: absolute;
            width: 20px;
            height: 20px;
            background: ${color};
            border-radius: 50%;
            border: 2px solid white;
            box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
            transition: all 0.3s ease;
            opacity: 0.8;
            z-index: 1000;
        `;
        
        // Add name label
        const label = document.createElement('div');
        label.style.cssText = `
            position: absolute;
            top: -25px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 10px;
            white-space: nowrap;
            opacity: 0;
            transition: opacity 0.3s ease;
        `;
        label.textContent = this.participants.get(id)?.name || 'Musician';
        cursor.appendChild(label);
        
        this.cursorContainer.appendChild(cursor);
        return cursor;
    }
    
    animateCursors() {
        this.participants.forEach((participant, id) => {
            if (Date.now() - participant.lastMove > 30000) {
                // Fade out after 30 seconds of inactivity
                participant.cursor.style.opacity = '0';
                participant.cursor.style.transform = 'scale(0.5)';
            } else {
                // Random movement simulation
                const x = Math.random() * (window.innerWidth - 20);
                const y = Math.random() * (window.innerHeight - 20);
                
                participant.cursor.style.left = `${x}px`;
                participant.cursor.style.top = `${y}px`;
                participant.lastMove = Date.now();
                
                // Show name on hover
                participant.cursor.addEventListener('mouseenter', () => {
                    participant.cursor.querySelector('div').style.opacity = '1';
                });
                participant.cursor.addEventListener('mouseleave', () => {
                    participant.cursor.querySelector('div').style.opacity = '0';
                });
            }
        });
        
        // Continue animation
        setTimeout(() => this.animateCursors(), 2000);
    }
    
    updateParticipantCounter() {
        const activeParticipants = Array.from(this.participants.values())
            .filter(p => Date.now() - p.lastMove < 30000).length;
            
        this.participantCounter.innerHTML = `
            <i class="fas fa-users"></i>
            <span>${activeParticipants} active</span>
        `;
    }
    
    getRandomColor() {
        const colors = ['#F5C242', '#4CAF50', '#2196F3', '#9C27B0', '#FF5722', '#00BCD4', '#FF9800'];
        return colors[Math.floor(Math.random() * colors.length)];
    }
    
    startUsageMonitoring() {
        // Check usage every 5 minutes
        this.usageCheckInterval = setInterval(() => {
            this.checkFlyUsage();
            this.updateParticipantCounter();
            
            // Show donation prompt if over capacity
            if (this.currentUsage > this.usageLimit * 0.8) {
                this.showDonationPrompt();
            }
        }, 300000); // 5 minutes
    }
    
    showDonationPrompt() {
        if (this.donationPromptTimer) return; // Already showing
        
        this.donationPromptTimer = setTimeout(() => {
            this.showNotification('KeyLink is getting popular! Help keep it running with a donation 🎵', 5000);
            this.openDonationModal();
            this.donationPromptTimer = null;
        }, 10000); // Show after 10 seconds
    }
}

// Utility function for smooth scrolling
function scrollToSlide(slideIndex) {
    const presentation = window.keylinkPresentation;
    if (presentation) {
        presentation.goToSlide(slideIndex);
    }
}

// Initialize presentation when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.keylinkPresentation = new KeyLinkPresentation();
});

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes slideInRight {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
    }
    
    @keyframes slideOutRight {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
    }
    
    @keyframes fadeIn {
        from { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
        to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
    }
    
    @keyframes fadeOut {
        from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        to { opacity: 0; transform: translate(-50%, -50%) scale(0.8); }
    }
    
    .sync-indicator {
        animation: slideInRight 0.3s ease;
    }
    
    .success-message {
        animation: fadeIn 0.3s ease;
    }
    
    .goal-message {
        animation: fadeIn 0.3s ease;
    }
`;
document.head.appendChild(style);
