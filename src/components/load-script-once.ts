// tslint:disable:variable-name

export default class LoadScriptOnce extends HTMLElement {
    static get observedAttributes() {
        return ['async', 'defer', 'load', 'src'];
    }

    async = false;
    defer = false;
    src = '';

    get load() {
        return this._load;
    }

    set load(val: boolean) {
        this._load = val;

        if (this._hasBeenLoaded || !val) {
            return;
        }

        this._hasBeenLoaded = true;

        const script = document.createElement('script');
        script.async = this.async;
        script.defer = this.defer;
        script.src = this.src;
        document.body.appendChild(script);
    }

    private _hasBeenLoaded = false;
    private _load = false;

    attributeChangedCallback(name: string, oldVal: string, newVal: string) {
        if (oldVal === newVal) {
            return;
        }

        switch (name) {
            case 'async':
                this.async = newVal != null;
                break;
            case 'defer':
                this.defer = newVal != null;
                break;
            case 'load':
                this.load = newVal != null;
                break;
            case 'src':
                this.src = newVal;
                break;
        }
    }
}

customElements.define('load-script-once', LoadScriptOnce);
