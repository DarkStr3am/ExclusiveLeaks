document.addEventListener("DOMContentLoaded", function () {
    const unlockButtons = document.querySelectorAll('.unlock-btn');
    const modal = document.getElementById('content-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.getElementById('close-modal');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const requestForm = document.getElementById('requestForm');

    // Exchange rate (1 USD = 1500 NGN)
    const exchangeRate = 1500;

    // Initialize Email.js
    emailjs.init('xreCbn0A5Y9EWeRhu'); // Replace with your Email.js user ID

    // --- BALANCE SYSTEM ---
    const balanceKey = 'userBalance';
    const balanceDisplay = document.getElementById('balance-display');
    const addFundsBtn = document.getElementById('add-funds-btn');
    const addFundsModal = document.getElementById('add-funds-modal');
    const closeAddFundsModal = document.getElementById('close-add-funds-modal');
    const addFundsForm = document.getElementById('addFundsForm');
    const fundsAmountInput = document.getElementById('funds-amount');

    // Helper: Get/Set balance in localStorage
    function getBalance() {
        const bal = localStorage.getItem(balanceKey);
        if (!bal) return { usd: 0, ngn: 0 };
        try { return JSON.parse(bal); } catch { return { usd: 0, ngn: 0 }; }
    }
    function setBalance(usd, ngn) {
        localStorage.setItem(balanceKey, JSON.stringify({ usd, ngn }));
    }
    function updateBalanceDisplay() {
        const { usd, ngn } = getBalance();
        balanceDisplay.textContent = `Balance: $${usd.toFixed(2)} | ₦${ngn.toLocaleString()}`;
    }
    // Show modal
    addFundsBtn.addEventListener('click', () => {
        addFundsModal.style.display = 'flex';
        fundsAmountInput.value = '';
    });
    closeAddFundsModal.addEventListener('click', () => {
        addFundsModal.style.display = 'none';
    });
    window.addEventListener('click', (e) => {
        if (e.target === addFundsModal) addFundsModal.style.display = 'none';
    });
    // Handle Add Funds form
    addFundsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        const usdAmount = parseFloat(fundsAmountInput.value);
        if (!usdAmount || usdAmount <= 0) return;
        const ngnAmount = Math.round(usdAmount * exchangeRate);
        // Start Paystack payment
        PaystackPop.setup({
            key: 'pk_live_c3cf5739e45fb82bf23db2656af1f81f37fd5230',
            email: 'ellasandramamcy01@gmail.com',
            amount: ngnAmount * 100,
            currency: 'NGN',
            callback: function () {
                // On success, update balance
                const bal = getBalance();
                const newUsd = bal.usd + usdAmount;
                const newNgn = bal.ngn + ngnAmount;
                setBalance(newUsd, newNgn);
                updateBalanceDisplay();
                addFundsModal.style.display = 'none';
                alert(`Funds added! New balance: $${newUsd.toFixed(2)} | ₦${newNgn.toLocaleString()}`);
            },
            onClose: function () {
                alert('Payment closed without completion.');
            }
        }).openIframe();
    });
    // Initialize balance display on load
    updateBalanceDisplay();
    // --- END BALANCE SYSTEM ---

    // Handle Payment Processing
    function initiatePayment(contentItem, priceInUSD) {
        const bal = getBalance();
        if (bal.usd >= priceInUSD) {
            // Deduct from balance
            const newUsd = bal.usd - priceInUSD;
            const newNgn = Math.round(newUsd * exchangeRate);
            setBalance(newUsd, newNgn);
            updateBalanceDisplay();
            replaceUnlockWithView(contentItem);
            alert(`Unlocked! $${priceInUSD.toFixed(2)} deducted. Remaining: $${newUsd.toFixed(2)} | ₦${newNgn.toLocaleString()}`);
        } else {
            if (confirm('Insufficient balance. Would you like to add funds?')) {
                addFundsModal.style.display = 'flex';
            }
        }
    }

    function replaceUnlockWithView(contentItem) {
        const unlockButton = contentItem.querySelector('.unlock-btn');
        if (!unlockButton) return;
        // Only add 'View' button for videos
        const isVideo = contentItem.getAttribute('data-type') === 'video';
        if (isVideo) {
            const viewButton = document.createElement('button');
            viewButton.textContent = 'View';
            viewButton.classList.add('view-btn');
            viewButton.addEventListener('click', function () {
                showContent(contentItem);
            });
            unlockButton.replaceWith(viewButton);
        } else {
            // For images, replace unlock button with 'Open' button and remove lock overlay
            const openButton = document.createElement('button');
            openButton.textContent = 'Open';
            openButton.classList.add('open-btn');
            openButton.addEventListener('click', function () {
                const unlockedPath = contentItem.getAttribute('data-image-path');
                if (unlockedPath) {
                    window.open(unlockedPath, '_blank');
                }
            });
            unlockButton.replaceWith(openButton);
            const lockOverlay = contentItem.querySelector('.locked-overlay');
            if (lockOverlay) lockOverlay.remove();
        }
    }

    // Helper: Fade in element
    function fadeIn(element, duration = 400) {
        element.style.opacity = 0;
        element.style.display = 'block';
        let last = +new Date();
        let tick = function() {
            element.style.opacity = +element.style.opacity + (new Date() - last) / duration;
            last = +new Date();
            if (+element.style.opacity < 1) {
                requestAnimationFrame(tick);
            } else {
                element.style.opacity = 1;
            }
        };
        tick();
    }

    // Helper: Show loading spinner
    function showSpinner(target) {
        const spinner = document.createElement('div');
        spinner.className = 'loading-spinner';
        spinner.id = 'modal-spinner';
        target.appendChild(spinner);
    }
    function hideSpinner() {
        const spinner = document.getElementById('modal-spinner');
        if (spinner) spinner.remove();
    }

    function showContent(contentItem) {
        // Remove the locked overlay
        const lockOverlay = contentItem.querySelector('.locked-overlay');
        if (lockOverlay) {
            lockOverlay.remove();
        }
        // Resize content to fit frame (4:3)
        const mediaContent = contentItem.querySelector('.media-content');
        if (mediaContent) {
            mediaContent.style.aspectRatio = '4 / 3';
        }
        // Display modal with content
        modal.style.display = 'flex';
        modalBody.innerHTML = '';
        showSpinner(modalBody);
        setTimeout(() => {
            hideSpinner();
            const videoElement = contentItem.querySelector('video');
            const imageElement = contentItem.querySelector('img');
            if (videoElement) {
                const videoClone = videoElement.cloneNode(true);
                videoClone.controls = true;
                videoClone.muted = false;
                videoClone.style.aspectRatio = '4 / 3';
                modalBody.appendChild(videoClone);
                videoClone.play().catch(error => {
                    console.error('Error playing video:', error);
                });
                fadeIn(videoClone, 400);
            }
            // if (imageElement) {
            //     const unlockedPath = contentItem.getAttribute('data-image-path');
            //     const img = document.createElement('img');
            //     img.src = unlockedPath || imageElement.src;
            //     img.alt = "Unlocked Content";
            //     img.style.aspectRatio = '4 / 3';
            //     modalBody.appendChild(img);
            //     fadeIn(img, 400);
            // }
        }, 600);
    }

    // Animate modal fade-in
    const originalShowContent = showContent;
    showContent = function(contentItem) {
        modal.style.opacity = 0;
        originalShowContent(contentItem);
        setTimeout(() => {
            fadeIn(modal, 400);
        }, 50);
    };

    // Animate button clicks
    document.body.addEventListener('click', function(e) {
        if (e.target.classList.contains('unlock-btn') || e.target.classList.contains('view-btn') || e.target.classList.contains('cta-btn')) {
            e.target.style.transform = 'scale(0.95)';
            setTimeout(() => {
                e.target.style.transform = '';
            }, 120);
        }
    });

    closeModal.addEventListener('click', function () {
        modal.style.display = 'none';

        // Stop video playback and clean up
        const videoInModal = modalBody.querySelector('video');
        if (videoInModal) {
            videoInModal.pause();
            modalBody.removeChild(videoInModal);
        }
    });

    unlockButtons.forEach(button => {
        button.addEventListener('click', function () {
            const contentId = button.getAttribute('data-content');
            const priceInUSD = parseFloat(button.getAttribute('data-price'));

            const contentItem = document.getElementById(contentId);

            if (contentItem.classList.contains('locked')) {
                initiatePayment(contentItem, priceInUSD);
            }
        });
    });

    // Handle Search Functionality
    searchButton.addEventListener('click', function () {
        const query = searchInput.value.toLowerCase();
        const contentItems = document.querySelectorAll('.media-container');

        contentItems.forEach(item => {
            const contentName = item.querySelector('span').textContent.toLowerCase();
            if (contentName.includes(query)) {
                item.style.display = 'block';
            } else {
                item.style.display = 'none';
            }
        });
    });

    // --- CONTENT TABS ---
    const tabBtns = document.querySelectorAll('.tab-btn');
    const mediaContainers = document.querySelectorAll('.media-container');
    tabBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            tabBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const tab = btn.getAttribute('data-tab');
            mediaContainers.forEach(mc => {
                if (tab === 'all') {
                    mc.style.display = '';
                } else if (tab === 'videos') {
                    mc.style.display = mc.getAttribute('data-type') === 'video' ? '' : 'none';
                } else if (tab === 'images') {
                    mc.style.display = mc.getAttribute('data-type') === 'image' ? '' : 'none';
                }
            });
        });
    });
    // --- END CONTENT TABS ---

    // --- REQUEST FORM FEEDBACK ---
    const requestFeedback = document.getElementById('request-feedback');
    requestForm.addEventListener('submit', function (event) {
        event.preventDefault();
        const formData = new FormData(requestForm);
        const templateParams = {
            name: formData.get('name'),
            email: formData.get('email'),
            message: formData.get('message')
        };
        // Deduct $0.2 from balance for a request
        const { usd, ngn } = getBalance();
        const requestCost = 0.2;
        if (usd < requestCost) {
            requestFeedback.textContent = 'Insufficient balance to make a request. Please add funds.';
            requestFeedback.classList.add('error');
            setTimeout(() => { requestFeedback.textContent = ''; requestFeedback.classList.remove('error'); }, 4000);
            return;
        }
        const newUsd = +(usd - requestCost).toFixed(3);
        const newNgn = Math.round(newUsd * 1500);
        setBalance(newUsd, newNgn);
        updateBalanceDisplay();
        emailjs.send('service_d4iptss', 'template_a68zkc4', templateParams)
            .then(function (response) {
                requestFeedback.textContent = 'Request sent successfully! $0.2 deducted.';
                requestFeedback.classList.remove('error');
                requestForm.reset();
                setTimeout(() => { requestFeedback.textContent = ''; }, 4000);
            }, function (error) {
                requestFeedback.textContent = 'Failed to send request. Please try again.';
                requestFeedback.classList.add('error');
                setTimeout(() => { requestFeedback.textContent = ''; requestFeedback.classList.remove('error'); }, 4000);
            });
    });
    // --- END REQUEST FORM FEEDBACK ---
});
