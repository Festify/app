/* tslint:disable:variable-name */
class LoadOnce extends HTMLElement {
    _load: boolean;
    _hasBeenLoaded: boolean = false;

    static get observedAttributes() {
        return ['load'];
    }

    attributeChangedCallback(name: string, oldVal: string | null, newVal: string | null) {
        if (name === 'load') {
            // tslint:disable-next-line:triple-equals
            this.load = newVal != null;
        }
    }

    get load() {
        return this._load;
    }

    set load(val: boolean) {
        this._load = val;
        if (this._hasBeenLoaded || !val) {
            return;
        }

        this._hasBeenLoaded = true;
        const templ: HTMLTemplateElement | null = this.querySelector('template');
        if (!templ) {
            throw new Error("LoadOnce needs a template element inside to work");
        }
        const subject = document.importNode(templ.content, true);

        this.attachShadow({ mode: 'open' });
        this.shadowRoot!.appendChild(subject);
    }
}

customElements.define('load-once', LoadOnce);
export default LoadOnce;
