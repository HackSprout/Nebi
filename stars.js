// Create stars effect
const createStars = () => {
    const starsContainer = document.getElementById('stars');
    if (!starsContainer) return;

    starsContainer.innerHTML = ''; // clears previous stars so it can be randomized

    const numStars = 50;
    for (let i = 0; i < numStars; i++) {
        // a div element created for each star
        const star = document.createElement('div');
        star.className = 'star';

        // randomly setting the position of the star
        star.style.left = `${Math.random() * 100}%`;
        star.style.top = `${Math.random() * 100}%`;

        // randomly sizing the stars between 2px and 4px
        const size = 2 + Math.random() * 2;
        star.style.width = `${size}px`;
        star.style.height = `${size}px`;

        // random animation delay for each star
        star.style.animationDelay = `${Math.random() * 2}s`;

        // newly created div appended to starsContainer
        starsContainer.appendChild(star);
    }
};

document.addEventListener('DOMContentLoaded', () => {
    createStars();
});
