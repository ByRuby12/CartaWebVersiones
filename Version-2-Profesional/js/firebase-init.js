(function initializeFirebase() {
    const firebaseConfig = {
        apiKey: 'AIzaSyD1C9BrRChpQp0GSD1yl34tazQnkYQk3SA',
        authDomain: 'procesador-textos.firebaseapp.com',
        projectId: 'procesador-textos',
        storageBucket: 'procesador-textos.firebasestorage.app',
        messagingSenderId: '342518347690',
        appId: '1:342518347690:web:1b5ffef5e755b242061dd3'
    };

    if (!window.firebase || window.firebase.apps.length) return;

    const app = window.firebase.initializeApp(firebaseConfig);
    if (window.firebase.auth) window.firebaseAuth = app.auth();
    if (window.firebase.firestore) window.firebaseDb = app.firestore();
})();
