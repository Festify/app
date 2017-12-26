import { html } from 'fit-html';

export default html`
    <style>
        :host, * {
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
    </style>
`;
