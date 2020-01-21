import { html } from 'lit-html';

export default html`
    <style>
        :host,
        * {
            box-sizing: border-box;
            color: white;
        }

        :host > * {
            --paper-button-disabled: {
                background: var(--primary-color-dark);
            }
        }

        input {
            font-family: 'Roboto', 'Noto', sans-serif;
        }

        paper-button {
            background: var(--primary-color);
            display: block;
            margin: 0;
            text-align: center;
        }

        paper-input {
            text-align: center;
        }

        paper-spinner-lite {
            --paper-spinner-color: var(--primary-color);
        }

        h1 {
            color: #212121;
            font-size: 22px;
            margin: 16px 0;
        }

        paper-button.login {
            display: flex;
            align-items: center;
            justify-content: flex-start;
            text-align: left;
        }

        paper-button.login iron-icon {
            margin: 0 1em 0 0.5em;
        }

        paper-button.login span {
            display: none;
            margin-right: 3.5px;
        }

        paper-button.login[disabled] {
            opacity: 0.5;
        }

        paper-button.facebook {
            background: #3b5998;
        }

        paper-button.github {
            background: #333333;
        }

        paper-button.google {
            background: #dd4b39;
        }

        paper-button.spotify {
            background: #1db954;
        }

        paper-button.twitter {
            background: #1da1f2;
        }

        @media (min-width: 420px) {
            paper-button.login span {
                display: inline;
            }
        }
    </style>
`;
