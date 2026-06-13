console.log("SETTINGS MANAGER LOADED");
document.addEventListener("DOMContentLoaded", function () {
    const savedTheme = localStorage.getItem('gamewise-theme');
    if (savedTheme) {
        applySettings({ theme: savedTheme });
    }

    // Apply saved font size and animations
    const savedFontSize = localStorage.getItem('gamewise-font-size');
    if (savedFontSize) {
        applySettings({ fontSize: savedFontSize });
    }

    const savedAnimations = localStorage.getItem('gamewise-animations');
    if (savedAnimations !== null) {
        applySettings({ animations: savedAnimations === 'true' });
    }

    firebase.auth().onAuthStateChanged(function(user) {
        if (!user) return;

        const db = firebase.database();

        db.ref('users/' + user.uid + '/settings').once('value')
        .then(snapshot => {
            const settings = snapshot.val();
            if (!settings) return;

            if (settings.theme) {
                localStorage.setItem('gamewise-theme', settings.theme);
            }
            applySettings(settings);
        });
    });

});

function applySettings(settings) {

    // THEME
    const theme = settings.theme || 'default';

    const themes = ['default', 'dark', 'light', 'purple'];
    document.body.classList.remove(...themes.map(t => t + '-theme'));
    document.querySelector('header')?.classList.remove(...themes.map(t => t + '-theme'));
    document.querySelector('.sidebar')?.classList.remove(...themes.map(t => t + '-theme'));

    if (theme !== 'default') {
        document.body.classList.add(theme + '-theme');
        document.querySelector('header')?.classList.add(theme + '-theme');
        document.querySelector('.sidebar')?.classList.add(theme + '-theme');
    }

    // FONT SIZE
    if (settings.fontSize) {
        // Remove existing font size classes
        document.body.classList.remove('font-small', 'font-medium', 'font-large');

        // Add the new font size class
        if (settings.fontSize !== 'medium') {
            document.body.classList.add('font-' + settings.fontSize);
        }
    }

    // ANIMATIONS
    if (settings.animations === false) {
        document.body.classList.add('no-animations');
    }

    console.log("Settings applied:", settings);
}