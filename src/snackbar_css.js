const css = `

.snackbars {
    display: block;
    position: fixed;
    left: 0;
    bottom: 0;
    width: 100vw;
    height: 0;
    z-index: 100;
    overflow: visible;
}

@scope (.snackbars) {
    :scope{
        --box-bg: var(--grey-2);
        --fg: var(--black-1);
        --border-radius: 20px;
        --control-border-radius: 20px;
    }

    .snackbar {
    position: absolute;
    box-sizing: border-box;
    left: 1.5%;
    bottom: 48px;
    width: 96%;
    transform-origin: center;
    will-change: transform;
    transition: transform 300ms ease, opacity 300ms ease;
    }

    .snackbar[aria-hidden='false'] {
    -webkit-animation: snackbar-show 300ms ease 1;
            animation: snackbar-show 300ms ease 1;
    }

    .snackbar[aria-hidden='true'] {
    -webkit-animation: snackbar-hide 300ms ease forwards 1;
            animation: snackbar-hide 300ms ease forwards 1;
    }

    @-webkit-keyframes snackbar-show {
    from {
        opacity: 0;
        transform: translate3d(0, 100%, 0)
    }
    }

    @keyframes snackbar-show {
    from {
        opacity: 0;
        transform: translate3d(0, 100%, 0)
    }
    }

    @-webkit-keyframes snackbar-hide {
    to {
        opacity: 0;
        transform: translateY(100%);
    }
    }

    @keyframes snackbar-hide {
    to {
        opacity: 0;
        transform: translateY(100%);
    }
    }


    .snackbar--container {
    display: flex;
    background: var(--box-bg);
    border-radius: var(--border-radius);
    box-shadow: 0 1px 4px rgba(0, 0, 0, 0.5);
    color: var(--fg);
    cursor: default;
    margin-bottom: 10px;
    }

    .snackbar--text {
    flex: 1 1 auto;
    padding: 16px;
    font-size: 100%;
    border-radius: var(--border-radius) 0px 0px var(--border-radius);
    }

    .snackbar--button {
    position: relative;
    flex: 0 1 auto;
    height: 36px;
    margin: auto 8px auto 8px;
    min-width: 5em;
    background: none;
    border: 1px solid;
    border-radius: var(--control-border-radius);
    font-weight: inherit;
    letter-spacing: 0.05em;
    font-size: 100%;
    text-transform: uppercase;
    text-align: center;
    cursor: pointer;
    overflow: hidden;
    transition: background-color 200ms ease;
    outline: none;
    }
    .snackbar--button:hover {
    background-color: rgba(0, 0, 0, 0.15);
    }
    .snackbar--button:focus:before {
    content: '';
    position: absolute;
    left: 50%;
    top: 50%;
    width: 120%;
    height: 0;
    padding: 0 0 120%;
    margin: -60% 0 0 -60%;
    background: rgba(255, 255, 255, 0.1);
    border-radius: 50%;
    transform-origin: center;
    will-change: transform;
    -webkit-animation: focus-ring 300ms ease-out forwards 1;
            animation: focus-ring 300ms ease-out forwards 1;
    pointer-events: none;
    }
    @-webkit-keyframes focus-ring {
    from {
        transform: scale(0.01);
    }
    }
    @keyframes focus-ring {
    from {
        transform: scale(0.01);
    }
    }
}
`

let e = document.createElement('style')
e.innerHTML = css
let h = document.head
h.insertAdjacentElement('afterbegin', e)
