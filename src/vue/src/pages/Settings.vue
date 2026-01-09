<template>
  <section class="section pt-1">
    <div class="columns is-multiline">
      <div class="column box is-full-mobile is-align-self-baseline sidenav">
        <SettingsSideNav :groups="navGroups" @jump="jumpTo" />
      </div>

      <SettingsSection
        v-if="systemConfig"
        section-id="features-section"
        title="Features"
        :offset="false"
      >
        <div class="mx-1 my-2 columns is-multiline bottomDivider">
          <div
            v-for="featureKey in featureKeys"
            :key="featureKey"
            class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd"
          >
            <BaseCheckbox
              v-model="systemConfig.features[featureKey]"
              :label="featureLabel(featureKey)"
            />
          </div>
        </div>
        <button class="button is-link px-6 ml-4 mt-1" @click="saveFeatures">Save</button>
      </SettingsSection>

      <SettingsSection
        v-if="systemConfig"
        section-id="strips-section"
        title="Attached Strips"
      >
        <div class="mx-1 my-2 columns is-multiline bottomDivider">
          <div
            v-for="(strip, index) in systemConfig.stripConfig"
            :key="`${strip.name}-${index}`"
            class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd"
          >
            <SettingsStripCard
              :strip="strip"
              :index="index"
              :typeClass="typeClass"
              :controller-label="controllerLabel(systemConfig.controllers?.[strip.controller], strip.controller)"
              @edit="openStripModal"
              @modify="openModifierModal"
              @delete="deleteStrip"
            />
          </div>
        </div>
        <button class="button is-success px-6 ml-4 mt-1" @click="openStripModal()">Add Strip</button>
      </SettingsSection>

      <SettingsSection
        v-if="systemConfig"
        section-id="controllers-section"
        title="Controllers"
      >
        <div class="mx-1 my-2 columns is-multiline bottomDivider">
          <div
            v-for="(controller, index) in (systemConfig.controllers || [])"
            :key="`${controller.name || controller.type}-${index}`"
            class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd"
          >
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">{{ controllerLabel(controller, index) }}</p>
                <div class="card-header-icon">
                  {{ index }}
                </div>
              </header>
                <div class="card-content">
                  <div class="content">
                  Type: {{ controllerTypeName(controller) }}
                  </div>
                  <div v-if="isWebSocketController(controller)" class="content">
                    URL: {{ controller.url }}
                  </div>
                  <div v-else-if="controller.type === 'GPIO'" class="content">
                    Pin: {{ controller.pin }}
                  </div>
              </div>
              <footer class="card-footer">
                <a class="card-footer-item" @click.prevent="openControllerModal(index)">Edit</a>
              </footer>
            </div>
          </div>
        </div>
        <button class="button is-success px-6 ml-4 mt-1" @click="openControllerModal()">Add Controller</button>
      </SettingsSection>

      <SettingsSection
        v-if="systemConfig"
        section-id="homekit-section"
        title="HomeKit Settings"
      >
        <div class="is-multiline bottomDivider">
          <div v-for="config in systemConfig.homekit" :key="config.name">
            <h3 class="title is-6 ml-2">{{ config.name }}</h3>
            <div class="block ml-3 mb-0">
              <p>Username: <span>{{ config.username }}</span></p>
              <p>Pincode: <span class="ml-4">{{ config.pincode }}</span></p>
            </div>
            <div class="mx-1 my-2 columns">
              <div
                v-for="(service, index) in config.services"
                :key="service.subtype || index"
                class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd"
              >
                <div v-if="service.strips" class="card">
                  <header class="card-header">
                    <p class="card-header-title">{{ service.name }}</p>
                    <div class="card-header-icon">Settings</div>
                  </header>
                  <div class="card-content">
                    <div class="content is-flex is-flex-wrap-wrap">
                      <span
                        v-for="strip in stripsForService(service)"
                        :key="strip.index"
                        :class="['tag', typeClass[strip.type] || 'is-light', 'is-medium', 'px-2', 'py-1', 'm-1']"
                      >
                        {{ strip.name }}
                      </span>
                    </div>
                    <div class="content">
                      <BaseCheckbox v-model="service.temperature" label="Temperature" />
                    </div>
                    <div class="content">
                      <BaseCheckbox v-model="service.hueAndSat" label="Hue and Saturation" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="button is-success px-6 ml-4 mt-1">Add Accessory</button>
        <button class="button is-link px-6 ml-4 mt-1" @click="saveHomekit">Save</button>
      </SettingsSection>

      <SettingsSection
        v-if="systemConfig"
        section-id="buttons-section"
        title="GPIO Buttons"
      >
        <div class="mx-1 my-2 columns is-multiline bottomDivider">
          <div
            v-for="(config, index) in systemConfig.buttonMap"
            :key="index"
            class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd"
          >
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">Button: {{ index }}</p>
                <div class="card-header-icon">Config</div>
              </header>
              <div class="card-content">
                <template v-if="config.pattern">
                  <div class="content">Pattern: {{ patternName(config.pattern) }}</div>
                  <div class="content">Effect: {{ effectName(config.effect) }}</div>
                </template>
                <div v-if="config.matrix" class="content">Matrix: {{ matrixName(config.matrix) }}</div>
                <div class="content is-flex is-flex-wrap-wrap">
                  <span
                    v-for="strip in buttonStrips(config)"
                    :key="strip.index"
                    :class="['tag', typeClass[strip.type] || 'is-light', 'is-medium', 'px-2', 'py-1', 'm-1']"
                  >
                    {{ strip.name }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="button is-success px-6 ml-4 mt-1">Add Button</button>
      </SettingsSection>

      <SettingsSection
        v-if="systemConfig && showMatrix"
        section-id="matrix-section"
        title="Matrix Display"
      >
        <div class="block">
          Strip:
          <span class="tag is-dark mx-2 py-0 px-2 is-medium">{{ matrixStripIndex }}</span>
          <span class="tag is-medium is-info py-1 px-2">{{ matrixStripName }}</span>
        </div>
        <div class="block">
          Default: <span>{{ matrixDefaultName }}</span>
        </div>
      </SettingsSection>

      <SettingsSection
        v-if="systemConfig"
        section-id="scripts-section"
      >
        <template #header>
          <div class="level">
            <div class="level-left">
              <div class="level-item">
                <h3 class="title is-5">Imported Scripts</h3>
              </div>
            </div>
            <div class="level-right">
              <div class="level-item">
                <div class="block mx-4 tags are-medium">
                  <span class="tag is-info">Total Options</span>
                  <span class="tag is-primary">Checkboxes</span>
                  <span class="tag is-link">Dropdowns</span>
                  <span class="tag is-warning">Colors</span>
                  <span class="tag is-danger">Numbers</span>
                </div>
              </div>
            </div>
          </div>
        </template>
        <div class="mx-1 my-2 columns is-multiline bottomDivider">
          <div
            v-for="section in scriptSections"
            :key="section.key"
            class="column is-half-desktop is-one-quarter-fullhd"
          >
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">{{ properCase(section.key) }}</p>
                <div class="card-header-icon">{{ section.list.length }}</div>
              </header>
              <div class="card-content">
                <div
                  v-for="script in section.items"
                  :key="script.id"
                  class="level"
                >
                  <div class="level-left">
                    <div class="level-item">{{ script.name }}</div>
                  </div>
                  <div class="level-right">
                    <div class="level-item">
                      <span class="tag is-info mr-4">{{ scriptCounts(script).total }}</span>
                      <span class="tag is-primary mx-1">{{ scriptCounts(script).select }}</span>
                      <span class="tag is-link mx-1">{{ scriptCounts(script).checkbox }}</span>
                      <span class="tag is-warning mx-1">{{ scriptCounts(script).color }}</span>
                      <span class="tag is-danger mx-1">{{ scriptCounts(script).number }}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        <button class="button is-danger px-6 ml-4 mt-1" @click="reloadScripts">Reload Scripts</button>
      </SettingsSection>
    </div>

    <BasePopup
      ref="scriptModal"
      :name="scriptModalTitle"
      save-text="Save changes"
      save-color="success"
    >
      <div class="field">
        <label class="label">Name</label>
        <div class="control">
          <BaseTextInput v-model="stripModal.name" />
        </div>
      </div>
      <div class="field">
        <label class="label">Length</label>
        <div class="control">
          <BaseNumberInput v-model="stripModal.length" />
        </div>
      </div>
      <div class="field">
        <label class="label">Type</label>
        <div class="control">
          <BaseDropdown
            :options="stripTypeOptions"
            color="link"
            v-model="stripModal.type"
          />
        </div>
      </div>
      <div class="field">
        <label class="label">Controller</label>
        <div class="control">
          <BaseDropdown
            :options="controllerOptions"
            color="link"
            v-model="stripModal.controller"
          />
        </div>
      </div>
      <template #footer>
        <button class="button is-success" @click="submitStripModal">Save changes</button>
        <button class="button" @click="$refs.scriptModal.internalClose()">Cancel</button>
      </template>
    </BasePopup>

    <BasePopup
      ref="controllerModal"
      :name="controllerModalTitle"
      save-text="Save changes"
      save-color="success"
    >
      <div class="field">
        <label class="label">Name</label>
        <div class="control">
          <BaseTextInput v-model="controllerModal.name" />
        </div>
      </div>
      <div class="field">
        <label class="label">Type</label>
        <div class="control">
          <BaseDropdown
            :options="controllerTypeOptions"
            color="link"
            v-model="controllerModal.type"
          />
        </div>
      </div>
      <div v-if="controllerModal.type === 'WebSocket'" class="field">
        <label class="label">URL</label>
        <div class="control">
          <BaseTextInput v-model="controllerModal.url" />
        </div>
      </div>
      <div v-else-if="controllerModal.type === 'GPIO'" class="field">
        <label class="label">Pin</label>
        <div v-if="gpioPinOptions.length" class="control">
          <BaseDropdown
            :options="gpioPinOptions"
            color="link"
            v-model="controllerModal.pin"
          />
        </div>
        <p v-else class="help is-danger">No valid GPIO pins are available for the current controller setup.</p>
      </div>
      <template #footer>
        <button
          v-if="editControllerIndex !== null && editControllerIndex !== undefined"
          class="button is-danger"
          @click="deleteController"
        >
          Delete
        </button>
        <button class="button is-success" @click="submitControllerModal">Save changes</button>
        <button class="button" @click="$refs.controllerModal.internalClose()">Cancel</button>
      </template>
    </BasePopup>

    <BasePopup
      ref="modifierModal"
      :name="modifierModalTitle"
      save-text="Save changes"
      save-color="success"
    >
      <div class="field">
        <label class="label">Type</label>
        <div class="control">
          <BaseDropdown
            :options="modifierSelectOptions"
            color="link"
            v-model="modifierModal.selected"
          />
        </div>
      </div>
      <div>
        <Option
          v-for="option in modifierModal.options"
          :key="option.id"
          :option="option"
        />
      </div>
    </BasePopup>
  </section>
</template>

<script>
import SettingsSideNav from '@/components/SettingsSideNav.vue';
import SettingsSection from '@/components/SettingsSection.vue';
import SettingsStripCard from '@/components/SettingsStripCard.vue';
import BaseCheckbox from '@/components/base/BaseCheckbox.vue';
import BaseDropdown from '@/components/base/BaseDropdown.vue';
import BaseNumberInput from '@/components/base/BaseNumberInput.vue';
import BasePopup from '@/components/base/BasePopup.vue';
import BaseTextInput from '@/components/base/BaseTextInput.vue';
import Option from '@/components/Option.vue';

export default {
  name: "Settings",
  components: {
    BaseCheckbox,
    BaseDropdown,
    BaseNumberInput,
    BasePopup,
    BaseTextInput,
    Option,
    SettingsSideNav,
    SettingsSection,
    SettingsStripCard
  },
  data() {
    return {
      socket: undefined,
      systemConfig: null,
      ledScripts: {},
      matrixScripts: {},
      editStripIndex: null,
      editControllerIndex: null,
      stripModal: {
        name: "",
        length: 16,
        type: "strip",
        controller: 0
      },
      controllerModal: {
        name: "",
        type: "WebSocket",
        url: "",
        pin: 18
      },
      modifierModal: {
        stripIndex: null,
        selected: "",
        options: [],
        existingValues: {}
      },
      featureLabels: {
        homekit: "HomeKit",
        weatherSensor: "Attached weather sensor",
        weatherFetch: "Get weather from web",
        gpioButtons: "Use GPIO buttons",
        gpioButtonsOnWeb: "Use button configs as web APIs",
        hostWebControl: "Host web control",
        webAPIs: "Host web APIs",
        ioStatsUpdate: "Listen for connected system stats",
        matrixDisplay: "Matrix display attached"
      },
      typeClass: {
        strip: "is-link",
        matrix: "is-info",
        ring: "is-warning",
        strand: "is-danger"
      },
      stripTypeOptions: [
        { id: "strip", name: "Strip" },
        { id: "matrix", name: "Matrix" },
        { id: "ring", name: "Ring" },
        { id: "strand", name: "Strand" }
      ],
      controllerTypeOptions: [
        { id: "WebSocket", name: "WebSocket" },
        { id: "GPIO", name: "GPIO" },
        { id: "Mock", name: "Mock" }
      ],
      gpioPinsSingle: [ 12, 18, 40, 52, 21, 31, 10, 38 ],
      gpioPinsPrimary: [ 12, 18, 40, 52 ],
      gpioPinsSecondary: [ 13, 19, 41, 45, 53 ]
    }
  },
  computed: {
    showMatrix() {
      return Boolean( this.systemConfig?.features?.matrixDisplay );
    },
    featureKeys() {
      if ( !this.systemConfig?.features ) {
        return [];
      }
      return Object.keys( this.systemConfig.features ).filter( key => key !== 'hostWebControl' );
    },
    navGroups() {
      return [
        {
          label: 'General',
          colorClass: 'has-text-warning',
          items: [
            { id: 'features', label: 'Features' },
            { id: 'strips', label: 'Strips' },
            { id: 'controllers', label: 'Controllers' },
            { id: 'homekit', label: 'HomeKit' }
          ]
        },
        {
          label: 'Add-ons',
          colorClass: 'has-text-danger',
          items: [
            { id: 'buttons', label: 'Buttons' },
            ...(this.showMatrix ? [ { id: 'matrix', label: 'Matrix' } ] : [])
          ]
        },
        {
          label: 'About',
          colorClass: 'has-text-warning',
          items: [
            { id: 'scripts', label: 'Scripts' }
          ]
        }
      ];
    },
    modifierSelectOptions() {
      const list = this.ledScripts?.modifiers?.list || [];
      return [ { id: "", name: "None" } ].concat(
        list.map( modifier => ({
          id: modifier,
          name: this.ledScripts?.modifiers?.[modifier]?.name || modifier
        }) )
      );
    },
    scriptSections() {
      if ( !this.ledScripts ) {
        return [];
      }
      return Object.keys( this.ledScripts )
        .filter( key => this.ledScripts[key]?.list )
        .map( key => ({
          key,
          list: this.ledScripts[key].list,
          items: this.ledScripts[key].list.map( id => ({
            id,
            name: this.ledScripts[key][id].name,
            options: this.ledScripts[key][id].options || []
          }) )
        }) );
    },
    displayMatrix() {
      return this.systemConfig?.displayMatrix || this.systemConfig?.matrixDisplay;
    },
    matrixStripIndex() {
      return this.displayMatrix?.strip ?? "";
    },
    matrixStripName() {
      const strip = this.systemConfig?.stripConfig?.[this.displayMatrix?.strip];
      return strip?.name || "";
    },
    matrixDefaultName() {
      const key = this.displayMatrix?.default;
      return this.matrixScripts?.[key]?.name || "";
    },
    scriptModalTitle() {
      if ( this.editStripIndex === null || this.editStripIndex === undefined ) {
        return "Add Strip";
      }
      return `Edit #${ this.editStripIndex }`;
    },
    controllerModalTitle() {
      if ( this.editControllerIndex === null || this.editControllerIndex === undefined ) {
        return "Add Controller";
      }
      return `Edit Controller #${ this.editControllerIndex }`;
    },
    modifierModalTitle() {
      if ( this.modifierModal.stripIndex === null || this.modifierModal.stripIndex === undefined ) {
        return "Modifiers";
      }
      const strip = this.systemConfig?.stripConfig?.[this.modifierModal.stripIndex];
      return `Modifiers - ${ strip?.name || 'Strip' }`;
    },
    controllerOptions() {
      if ( !this.systemConfig?.controllers ) {
        return [];
      }
      return this.systemConfig.controllers.map( ( controller, index ) => ( {
        id: index,
        name: this.controllerLabel( controller, index )
      } ) );
    },
    gpioPinOptions() {
      if ( this.controllerModal.type !== "GPIO" ) {
        return [];
      }
      const otherController = this.otherGpioController();
      let pins = this.gpioPinsSingle;
      if ( otherController ) {
        const otherPin = Number( otherController.pin );
        if ( this.gpioPinsPrimary.includes( otherPin ) ) {
          pins = this.gpioPinsSecondary;
        } else if ( this.gpioPinsSecondary.includes( otherPin ) ) {
          pins = this.gpioPinsPrimary;
        } else {
          pins = [];
        }
      }
      return pins.map( pin => ( { id: pin, name: `${pin}` } ) );
    }
  },
  methods: {
    isWebSocketController( controller ) {
      return controller?.type === "WebSocket" || controller?.type === "ESP32";
    },
    controllerTypeName( controller ) {
      if ( this.isWebSocketController( controller ) ) {
        return "WebSocket";
      }
      if ( controller?.type === "Mock" ) {
        return "Mock";
      }
      return controller?.type || "Unknown";
    },
    controllerLabel( controller, index ) {
      if ( index === null || index === undefined ) {
        return "Unassigned";
      }
      const name = controller?.name?.trim();
      if ( name ) {
        return name;
      }
      if ( controller?.type === "GPIO" ) {
        return `GPIO ${ controller?.pin ?? index }`;
      }
      if ( this.isWebSocketController( controller ) ) {
        return controller?.url ? `WebSocket ${ controller.url }` : "WebSocket";
      }
      return `Controller ${ index }`;
    },
    otherGpioController() {
      return ( this.systemConfig?.controllers || [] )
        .find( ( controller, index ) => controller?.type === "GPIO" && index !== this.editControllerIndex );
    },
    normalizeControllerType( controller ) {
      if ( this.isWebSocketController( controller ) ) {
        return { ...controller, type: "WebSocket" };
      }
      return controller;
    },
    normalizeControllers( controllers, strips ) {
      const controllersWithIndex = controllers.map( ( controller, index ) => ( {
        controller: this.normalizeControllerType( controller ),
        originalIndex: index
      } ) );
      const gpioControllers = controllersWithIndex.filter( entry => entry.controller?.type === "GPIO" );
      if ( gpioControllers.length > 2 ) {
        return { error: "Only 2 GPIO controllers can be used." };
      }
      if ( gpioControllers.length === 1 ) {
        const pin = Number( gpioControllers[0].controller?.pin );
        if ( !this.gpioPinsSingle.includes( pin ) ) {
          return { error: "GPIO pin must be one of the supported single-pin channels." };
        }
        const indexMap = {};
        controllersWithIndex.forEach( ( entry, newIndex ) => {
          indexMap[entry.originalIndex] = newIndex;
        } );
        return { controllers: controllersWithIndex.map( entry => entry.controller ), indexMap };
      }
      if ( gpioControllers.length === 2 ) {
        const primary = gpioControllers.find( entry => this.gpioPinsPrimary.includes( Number( entry.controller?.pin ) ) );
        const secondary = gpioControllers.find( entry => this.gpioPinsSecondary.includes( Number( entry.controller?.pin ) ) );
        if ( !primary || !secondary ) {
          return { error: "GPIO pins must use one primary and one secondary pin when two controllers are set." };
        }
        const insertIndex = Math.min( primary.originalIndex, secondary.originalIndex );
        const remaining = controllersWithIndex.filter( entry => entry !== primary && entry !== secondary );
        const insertAt = remaining.findIndex( entry => entry.originalIndex > insertIndex );
        const ordered = [ primary, secondary ];
        let reordered = [];
        if ( insertAt === -1 ) {
          reordered = remaining.concat( ordered );
        } else {
          reordered = remaining.slice( 0, insertAt ).concat( ordered, remaining.slice( insertAt ) );
        }
        const indexMap = {};
        reordered.forEach( ( entry, newIndex ) => {
          indexMap[entry.originalIndex] = newIndex;
        } );
        return { controllers: reordered.map( entry => entry.controller ), indexMap };
      }
      const indexMap = {};
      controllersWithIndex.forEach( ( entry, newIndex ) => {
        indexMap[entry.originalIndex] = newIndex;
      } );
      return { controllers: controllersWithIndex.map( entry => entry.controller ), indexMap };
    },
    ensureGpioPinSelection() {
      if ( this.controllerModal.type !== "GPIO" ) {
        return;
      }
      const options = this.gpioPinOptions;
      if ( options.length === 0 ) {
        this.controllerModal.pin = "";
        return;
      }
      const current = Number( this.controllerModal.pin );
      if ( !options.some( option => Number( option.id ) === current ) ) {
        this.controllerModal.pin = options[0].id;
      }
    },
    featureLabel( key ) {
      return this.featureLabels[key] || key;
    },
    jumpTo( section ) {
      const element = document.getElementById( `${section}-section` );
      if ( element ) {
        element.scrollIntoView( { behavior: 'smooth', block: 'start' } );
      }
    },
    saveFeatures() {
      if ( this.systemConfig?.features ) {
        this.saveKey( 'features', this.systemConfig.features );
      }
    },
    saveHomekit() {
      if ( this.systemConfig?.homekit ) {
        this.saveKey( 'homekit', this.systemConfig.homekit );
      }
    },
    saveKey( key, data ) {
      if ( this.socket ) {
        this.socket.emit( 'setSettings', key, data );
      }
    },
    reloadScripts() {
      if ( this.socket ) {
        this.socket.emit( 'reloadScripts', ( data ) => {
          this.ledScripts = data;
        } );
      }
    },
    openStripModal( index = null ) {
      this.editStripIndex = index;
      if ( index !== null && index !== undefined ) {
        const strip = this.systemConfig.stripConfig[index];
        this.stripModal = {
          name: strip.name,
          length: strip.length,
          type: strip.type,
          controller: strip.controller ?? 0
        };
      } else {
        const defaultController = this.controllerOptions[0]?.id ?? null;
        this.stripModal = {
          name: "",
          length: 16,
          type: "strip",
          controller: defaultController
        };
      }
      this.$refs.scriptModal.open()
        .catch( () => {} );
    },
    saveStrip() {
      const name = this.stripModal.name?.trim();
      const length = Number( this.stripModal.length );
      const type = this.stripModal.type;
      const controller = Number( this.stripModal.controller );
      if ( !this.controllerOptions.length ) {
        window.alert( "You must create a controller first." );
        return false;
      }
      if ( !name || !length || !type || Number.isNaN( controller ) ) {
        window.alert( "You are missing something!" );
        return false;
      }
      if ( controller < 0 || controller >= this.controllerOptions.length ) {
        window.alert( "Please select a controller." );
        return false;
      }
      const index = this.editStripIndex;
      const isEdit = index !== null && index !== undefined;
      const strip = isEdit
        ? this.systemConfig.stripConfig[index]
        : {};
      strip.name = name;
      strip.length = length;
      strip.type = type;
      strip.controller = controller;
      if ( !isEdit ) {
        this.systemConfig.stripConfig.push( strip );
      }
      this.saveKey( 'strips', this.systemConfig.stripConfig );
      return true;
    },
    submitStripModal() {
      if ( this.saveStrip() ) {
        this.$refs.scriptModal.internalClose();
      }
    },
    openControllerModal( index = null ) {
      this.editControllerIndex = index;
      if ( index !== null && index !== undefined ) {
        const controller = this.systemConfig.controllers[index];
        this.controllerModal = {
          name: controller?.name || "",
          type: this.isWebSocketController( controller ) ? "WebSocket" : ( controller?.type || "WebSocket" ),
          url: controller?.url || "",
          pin: controller?.pin ?? 18
        };
      } else {
        this.controllerModal = {
          name: "",
          type: "WebSocket",
          url: "",
          pin: 18
        };
      }
      this.ensureGpioPinSelection();
      this.$refs.controllerModal.open()
        .catch( () => {} );
    },
    saveController() {
      const name = this.controllerModal.name?.trim();
      const type = this.controllerModal.type;
      const url = this.controllerModal.url?.trim();
      const pin = Number( this.controllerModal.pin );
      if ( !name || !type ) {
        window.alert( "You are missing something!" );
        return false;
      }
      if ( type === "WebSocket" && !url ) {
        window.alert( "Controller URL is required." );
        return false;
      }
      if ( type === "GPIO" && ( !pin || Number.isNaN( pin ) ) ) {
        window.alert( "Controller pin is required." );
        return false;
      }
      const controller = {
        name,
        type,
        ...( type === "WebSocket" ? { url } : {} ),
        ...( type === "GPIO" ? { pin } : {} )
      };
      const index = this.editControllerIndex;
      const isEdit = index !== null && index !== undefined;
      if ( !this.systemConfig.controllers ) {
        this.systemConfig.controllers = [];
      }
      const controllers = this.systemConfig.controllers.slice();
      if ( isEdit ) {
        controllers.splice( index, 1, controller );
      } else {
        controllers.push( controller );
      }
      const normalized = this.normalizeControllers( controllers, this.systemConfig.stripConfig );
      if ( normalized.error ) {
        window.alert( normalized.error );
        return false;
      }
      const updatedControllers = normalized.controllers || controllers;
      const indexMap = normalized.indexMap || {};
      const updatedStrips = ( this.systemConfig.stripConfig || [] ).map( strip => {
        if ( strip.controller === undefined || strip.controller === null ) {
          return strip;
        }
        const newIndex = indexMap[strip.controller];
        if ( newIndex === undefined ) {
          return strip;
        }
        return {
          ...strip,
          controller: newIndex
        };
      } );
      this.systemConfig.controllers = updatedControllers;
      this.systemConfig.stripConfig = updatedStrips;
      this.saveKey( 'controllers', this.systemConfig.controllers );
      this.saveKey( 'strips', this.systemConfig.stripConfig );
      return true;
    },
    submitControllerModal() {
      if ( this.saveController() ) {
        this.$refs.controllerModal.internalClose();
      }
    },
    deleteController() {
      const index = this.editControllerIndex;
      if ( index === null || index === undefined ) {
        return;
      }
      const hasAttachedStrips = ( this.systemConfig.stripConfig || [] )
        .some( strip => strip?.controller === index );
      if ( hasAttachedStrips ) {
        window.alert( "This controller still has strips attached." );
        return;
      }
      const controllers = ( this.systemConfig.controllers || [] ).slice();
      controllers.splice( index, 1 );
      const normalized = this.normalizeControllers( controllers, this.systemConfig.stripConfig );
      if ( normalized.error ) {
        window.alert( normalized.error );
        return;
      }
      const updatedControllers = normalized.controllers || controllers;
      const indexMap = normalized.indexMap || {};
      const defaultControllerIndex = updatedControllers.length ? 0 : null;
      const updatedStrips = ( this.systemConfig.stripConfig || [] ).map( strip => {
        if ( strip.controller === undefined || strip.controller === null ) {
          return strip;
        }
        const newIndex = indexMap[strip.controller];
        if ( newIndex === undefined ) {
          return {
            ...strip,
            controller: defaultControllerIndex
          };
        }
        return {
          ...strip,
          controller: newIndex
        };
      } );
      this.systemConfig.controllers = updatedControllers;
      this.systemConfig.stripConfig = updatedStrips;
      this.saveKey( 'controllers', this.systemConfig.controllers );
      this.saveKey( 'strips', this.systemConfig.stripConfig );
      this.$refs.controllerModal.internalClose();
    },
    deleteStrip( index ) {
      this.systemConfig.stripConfig.splice( index, 1 );
      this.saveKey( 'strips', this.systemConfig.stripConfig );
    },
    openModifierModal( index ) {
      const strip = this.systemConfig.stripConfig[index];
      this.modifierModal.stripIndex = index;
      this.modifierModal.selected = strip.modifier || "";
      this.modifierModal.existingValues = strip.modifierOptions || {};
      this.updateModifierOptions();
      this.$refs.modifierModal.open()
        .then( () => this.saveModifier() )
        .catch( () => {} );
    },
    updateModifierOptions() {
      const modifier = this.modifierModal.selected;
      if ( !modifier ) {
        this.modifierModal.options = [];
        return;
      }
      const modifierObj = this.ledScripts?.modifiers?.[modifier];
      if ( !modifierObj ) {
        this.modifierModal.options = [];
        return;
      }
      const existingValues = this.modifierModal.existingValues || {};
      this.modifierModal.options = modifierObj.options.map( option => {
        const fallback = option.default ?? ( option.type === 'colorArray' ? [] : option.value );
        return {
          ...option,
          value: existingValues[option.id] ?? fallback
        };
      } );
    },
    saveModifier() {
      const strip = this.systemConfig.stripConfig[this.modifierModal.stripIndex];
      strip.modifier = this.modifierModal.selected || undefined;
      let modifierOptions = {};
      if ( strip.modifier ) {
        this.modifierModal.options.forEach( option => {
          let value = option.value;
          if ( option.type === 'number' ) {
            value = Number( value );
          }
          modifierOptions[option.id] = value;
        } );
      }
      strip.modifierOptions = modifierOptions;
      this.saveKey( 'strips', this.systemConfig.stripConfig );
    },
    stripsForService( service ) {
      return service.strips
        .map( index => ({
          index,
          ...this.systemConfig.stripConfig[index]
        }) );
    },
    buttonStrips( config ) {
      const strips = ( config.strips || [] ).slice();
      if ( config.matrix && this.displayMatrix?.strip !== undefined && !strips.includes( this.displayMatrix.strip ) ) {
        strips.unshift( this.displayMatrix.strip );
      }
      return strips.map( index => ({
        index,
        ...this.systemConfig.stripConfig[index]
      }) );
    },
    patternName( id ) {
      return this.ledScripts?.patterns?.[id]?.name || id;
    },
    effectName( id ) {
      return this.ledScripts?.effects?.[id]?.name || id || "None";
    },
    matrixName( id ) {
      return this.matrixScripts?.[id]?.name || id;
    },
    properCase( value ) {
      if ( !value ) {
        return "";
      }
      return value.charAt( 0 ).toUpperCase() + value.slice( 1 ).toLowerCase();
    },
    scriptCounts( script ) {
      const counts = {
        total: script.options.length,
        checkbox: 0,
        select: 0,
        color: 0,
        number: 0
      };
      script.options.forEach( option => {
        switch ( option.type ) {
          case 'select':
            counts.select += 1;
            break;
          case 'checkbox':
            counts.checkbox += 1;
            break;
          case 'color':
          case 'colorArray':
            counts.color += 1;
            break;
          case 'number':
            counts.number += 1;
            break;
        }
      } );
      return counts;
    }
  },
  watch: {
    'modifierModal.selected'() {
      this.updateModifierOptions();
    },
    'controllerModal.type'() {
      this.ensureGpioPinSelection();
    }
  },
  created() {
    this.socket = io( 'http://localhost:7974/' );
    this.socket.on( 'connect', () => {
      this.socket.emit( 'getSettings', ( data ) => {
        this.systemConfig = data;
        this.socket.emit( 'getLEDScripts', ( scripts ) => {
          this.ledScripts = scripts;
          if ( this.showMatrix ) {
            this.socket.emit( 'getMatrixScripts', ( matrix ) => {
              this.matrixScripts = matrix;
            } );
          }
        } );
      } );
    } );
  }
}
</script>
