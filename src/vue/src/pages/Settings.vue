<template>
  <section class="section pt-1">
    <div class="columns is-multiline settings-columns">
      <div class="column box is-full-mobile is-align-self-baseline sidenav">
        <SettingsSideNav :groups="navGroups" @jump="jumpTo"/>
      </div>

      <SettingsSection
          v-if="systemConfig"
          section-id="features-section"
          title="Features"
          :offset="false"
          extra-class="is-align-self-flex-start"
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
              v-for="(strip, index) in stripConfig"
              :key="`${strip.name}-${strip.controller}-${strip.controllerStripIndex}-${index}`"
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
                <p class="card-header-title">{{ controllerLabel( controller, index ) }}</p>
                <div class="card-header-icon">
                  {{ index }}
                </div>
              </header>
              <div class="card-content">
                <div class="content">
                  Type: {{ controllerTypeName( controller ) }}
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
          v-if="systemConfig && systemConfig.features?.homekit"
          section-id="homekit-section"
          title="HomeKit Settings"
      >
        <div class="is-multiline bottomDivider">
          <div
              v-for="(config, configIndex) in (systemConfig.homekit || [])"
              :key="config.name || configIndex"
              class="box mx-1 my-2"
          >
            <div class="level is-mobile mb-2">
              <div class="level-left">
                <div class="level-item">
                  <h3 class="title is-6 mb-0">{{ config.name || `HomeKit Instance ${configIndex + 1}` }}</h3>
                </div>
              </div>
              <div class="level-right">
                <div class="level-item">
                  <button
                      class="button is-small is-link"
                      @click="openHomekitAccessoryModal(configIndex)"
                  >
                    Edit HomeKit Instance
                  </button>
                </div>
                <div class="level-item">
                  <button
                      class="button is-small is-success"
                      @click="openHomekitServiceModal(configIndex)"
                  >
                    Add Light
                  </button>
                </div>
              </div>
            </div>
            <div class="block ml-3 mb-0">
              <p>Username: <span>{{ config.username || 'Auto-generated' }}</span></p>
              <p>Pincode: <span class="ml-4">{{ config.pincode || 'Auto-generated' }}</span></p>
            </div>
            <div class="mx-1 my-2 columns is-multiline">
              <div
                  v-for="(service, index) in getHomekitServices(config)"
                  :key="service.subtype || index"
                  class="column is-half-tablet is-one-third-widescreen is-one-quarter-fullhd"
              >
                <div class="card">
                  <header class="card-header">
                    <p class="card-header-title">
                      {{ `${config.name || 'HomeKit Instance'}: ${service.name || `Light ${index + 1}`}` }}
                    </p>
                    <div class="card-header-icon">Light</div>
                  </header>
                  <div class="card-content">
                    <div class="content is-flex is-flex-wrap-wrap">
                      <span
                          v-for="strip in stripsForService(service)"
                          :key="strip.key"
                          :class="['tag', typeClass[strip.type] || 'is-light', 'is-medium', 'px-2', 'py-1', 'm-1']"
                      >
                        {{ strip.name }}
                      </span>
                    </div>
                    <div class="content is-flex is-flex-wrap-wrap">
                      <span v-if="service.temperature" class="tag is-warning is-light m-1">Temperature</span>
                      <span v-if="serviceSupportsHueAndSat(service)"
                            class="tag is-info is-light m-1">Hue & Saturation</span>
                    </div>
                  </div>
                  <footer class="card-footer">
                    <a class="card-footer-item" @click.prevent="openHomekitServiceModal(configIndex, index)">Edit</a>
                  </footer>
                </div>
              </div>
            </div>
            <p v-if="!getHomekitServices(config).length" class="help ml-2">No lights yet.</p>
          </div>
        </div>
        <button class="button is-success px-6 ml-4 mt-1" @click="openHomekitAccessoryModal()">Add HomeKit Instance
        </button>
        <button class="button is-link px-6 ml-4 mt-1" @click="saveHomekit">Save</button>
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
              class="column is-half"
          >
            <div class="card">
              <header class="card-header">
                <p class="card-header-title">{{ properCase( section.key ) }}</p>
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
                      <span class="tag is-info mr-4">{{ scriptCounts( script ).total }}</span>
                      <span class="tag is-primary mx-1">{{ scriptCounts( script ).select }}</span>
                      <span class="tag is-link mx-1">{{ scriptCounts( script ).checkbox }}</span>
                      <span class="tag is-warning mx-1">{{ scriptCounts( script ).color }}</span>
                      <span class="tag is-danger mx-1">{{ scriptCounts( script ).number }}</span>
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
          <BaseTextInput v-model="stripModal.name"/>
        </div>
      </div>
      <div class="field">
        <label class="label">Length</label>
        <div class="control">
          <BaseNumberInput v-model="stripModal.length"/>
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
          <BaseTextInput v-model="controllerModal.name"/>
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
          <BaseTextInput v-model="controllerModal.url"/>
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

    <BasePopup
        ref="homekitAccessoryModal"
        :name="homekitAccessoryModalTitle"
        save-text="Save changes"
        save-color="success"
    >
      <div class="field">
        <label class="label">HomeKit Instance Name</label>
        <div class="control">
          <BaseTextInput v-model="homekitAccessoryModal.name"/>
        </div>
      </div>
      <TransitionSelector
          inline
          label="Default Transition"
          :led-scripts="ledScripts"
          v-model="homekitAccessoryModal.transitionSelection"
      />
      <template #footer>
        <button
            v-if="editHomekitAccessoryIndex !== null && editHomekitAccessoryIndex !== undefined"
            class="button is-danger"
            @click="deleteHomekitAccessory"
        >
          Delete
        </button>
        <button class="button is-success" @click="submitHomekitAccessoryModal">Save changes</button>
        <button class="button" @click="$refs.homekitAccessoryModal.internalClose()">Cancel</button>
      </template>
    </BasePopup>

    <BasePopup
        ref="homekitServiceModal"
        :name="homekitServiceModalTitle"
        save-text="Save changes"
        save-color="success"
    >
      <div class="field">
        <label class="label">Light Name</label>
        <div class="control">
          <BaseTextInput v-model="homekitServiceModal.name"/>
        </div>
      </div>
      <div class="field">
        <label class="label">Strips</label>
        <div class="control is-flex is-flex-wrap-wrap">
          <BaseStripCheckbox
              v-for="(strip, index) in stripConfig"
              :key="`${strip.name}-${strip.controller}-${strip.controllerStripIndex}-${index}`"
              :name="strip.name || `Strip ${index}`"
              :model-value="isStripSelected(homekitServiceModal.strips, strip.id)"
              @update:modelValue="toggleHomekitStrip(strip.id, $event)"
          />
          <p v-if="!stripConfig.length" class="help ml-1">No strips available.</p>
        </div>
      </div>
      <div class="field">
        <label class="label">Capabilities</label>
        <div class="control">
          <BaseCheckbox v-model="homekitServiceModal.temperature" label="Temperature"/>
          <BaseCheckbox v-model="homekitServiceModal.hueAndSat" label="Hue & Saturation"/>
        </div>
      </div>
      <template #footer>
        <button
            v-if="editHomekitServiceIndex !== null && editHomekitServiceIndex !== undefined"
            class="button is-danger"
            @click="deleteHomekitService"
        >
          Delete
        </button>
        <button class="button is-success" @click="submitHomekitServiceModal">Save changes</button>
        <button class="button" @click="$refs.homekitServiceModal.internalClose()">Cancel</button>
      </template>
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
import BaseStripCheckbox from '@/components/base/BaseStripCheckbox.vue';
import BaseTextInput from '@/components/base/BaseTextInput.vue';
import Option from '@/components/Option.vue';
import TransitionSelector from '@/components/TransitionSelector.vue';
import { getSocket } from "@/socket";

export default {
  name: "Settings",
  components: {
    BaseCheckbox,
    BaseDropdown,
    BaseNumberInput,
    BasePopup,
    BaseStripCheckbox,
    BaseTextInput,
    TransitionSelector,
    Option,
    SettingsSideNav,
    SettingsSection,
    SettingsStripCard
  },
  data() {
    return {
      socket: undefined,
      socketConnectHandler: undefined,
      systemConfig: null,
      ledScripts: {},
      matrixScripts: {},
      editStripIndex: null,
      editControllerIndex: null,
      editHomekitAccessoryIndex: null,
      editHomekitServiceIndex: null,
      editHomekitServiceAccessoryIndex: null,
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
        controllerIndex: null,
        controllerStripIndex: null,
        selected: "",
        options: [],
        existingValues: {}
      },
      homekitAccessoryModal: {
        name: "",
        transitionSelection: {
          id: 'none',
          options: {}
        }
      },
      homekitServiceModal: {
        name: "",
        strips: [],
        temperature: false,
        hueAndSat: false,
        type: "light"
      },
      featureLabels: {
        homekit: "HomeKit",
        weatherSensor: "Attached weather sensor",
        weatherFetch: "Get weather from web",
        gpioButtons: "Use GPIO buttons",
        gpioButtonsOnWeb: "Use button configs as web APIs",
        hostWebControl: "Host web control",
        webAPIs: "Enable REST APIs",
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
      gpioPinsSingle: [12, 18, 40, 52, 21, 31, 10, 38],
      gpioPinsPrimary: [12, 18, 40, 52],
      gpioPinsSecondary: [13, 19, 41, 45, 53]
    }
  },
  computed: {
    showMatrix() {
      return Boolean( this.systemConfig?.features?.matrixDisplay );
    },
    featureKeys() {
      if( !this.systemConfig?.features ) {
        return [];
      }
      const hiddenFeatures = new Set( [
        'gpioButtons',
        'gpioButtonsOnWeb',
        'matrixDisplay',
        'weatherFetch',
        'weatherSensor',
        'hostWebControl',
        'ioStatsUpdate'
      ] );
      return Object.keys( this.systemConfig.features ).filter( key => !hiddenFeatures.has( key ) );
    },
    stripConfig() {
      if( !this.systemConfig?.controllers ) {
        return [];
      }
      const strips = [];
      this.systemConfig.controllers.forEach( ( controller, controllerIndex ) => {
        ( controller.strips || [] ).forEach( ( strip, stripIndex ) => {
          strips.push( {
            ...strip,
            id: [controllerIndex, stripIndex],
            controller: controllerIndex,
            controllerStripIndex: stripIndex
          } );
        } );
      } );
      return strips;
    },
    navGroups() {
      let arr = [];

      arr.push( {
        label: 'General',
        colorClass: 'has-text-warning',
        items: [
          { id: 'features', label: 'Features' },
          { id: 'strips', label: 'Strips' },
          { id: 'controllers', label: 'Controllers' }
        ]
      } );

      if( this.showMatrix || this.systemConfig?.features?.homekit ) {
        arr.push( {
          label: 'Add-ons',
          colorClass: 'has-text-danger',
          items: [
            ...( this.systemConfig?.features?.homekit ? [{ id: 'homekit', label: 'HomeKit' }] : [] ),
            ...( this.showMatrix ? [{ id: 'matrix', label: 'Matrix' }] : [] )
          ]
        } );
      }

      arr.push( {
        label: 'About',
        colorClass: 'has-text-warning',
        items: [
          { id: 'scripts', label: 'Scripts' }
        ]
      } );

      return arr;
    },
    modifierSelectOptions() {
      const list = this.ledScripts?.modifiers?.list || [];
      return [{ id: "", name: "None" }].concat(
          list.map( modifier => ( {
            id: modifier,
            name: this.ledScripts?.modifiers?.[modifier]?.name || modifier
          } ) )
      );
    },
    scriptSections() {
      if( !this.ledScripts ) {
        return [];
      }
      return Object.keys( this.ledScripts )
          .filter( key => this.ledScripts[key]?.list )
          .map( key => ( {
            key,
            list: this.ledScripts[key].list,
            items: this.ledScripts[key].list.map( id => ( {
              id,
              name: this.ledScripts[key][id].name,
              options: this.ledScripts[key][id].options || []
            } ) )
          } ) );
    },
    displayMatrix() {
      return this.systemConfig?.displayMatrix || this.systemConfig?.matrixDisplay;
    },
    matrixStripIndex() {
      return this.stripIdKey( this.displayMatrix?.strip );
    },
    matrixStripName() {
      const strip = this.getStripById( this.displayMatrix?.strip );
      return strip?.name || "";
    },
    matrixDefaultName() {
      const key = this.displayMatrix?.default;
      return this.matrixScripts?.[key]?.name || "";
    },
    scriptModalTitle() {
      if( this.editStripIndex === null || this.editStripIndex === undefined ) {
        return "Add Strip";
      }
      return `Edit #${this.editStripIndex}`;
    },
    controllerModalTitle() {
      if( this.editControllerIndex === null || this.editControllerIndex === undefined ) {
        return "Add Controller";
      }
      return `Edit Controller #${this.editControllerIndex}`;
    },
    modifierModalTitle() {
      if( this.modifierModal.stripIndex === null || this.modifierModal.stripIndex === undefined ) {
        return "Modifiers";
      }
      const strip = this.stripConfig?.[this.modifierModal.stripIndex];
      return `Modifiers - ${strip?.name || 'Strip'}`;
    },
    homekitAccessoryModalTitle() {
      if( this.editHomekitAccessoryIndex === null || this.editHomekitAccessoryIndex === undefined ) {
        return "Add HomeKit Instance";
      }
      return `Edit HomeKit Instance #${this.editHomekitAccessoryIndex}`;
    },
    homekitServiceModalTitle() {
      if( this.editHomekitServiceIndex === null || this.editHomekitServiceIndex === undefined ) {
        return "Add Light";
      }
      return `Edit Light #${this.editHomekitServiceIndex}`;
    },
    controllerOptions() {
      if( !this.systemConfig?.controllers ) {
        return [];
      }
      return this.systemConfig.controllers.map( ( controller, index ) => ( {
        id: index,
        name: this.controllerLabel( controller, index )
      } ) );
    },
    gpioPinOptions() {
      if( this.controllerModal.type !== "GPIO" ) {
        return [];
      }
      const otherController = this.otherGpioController();
      let pins = this.gpioPinsSingle;
      if( otherController ) {
        const otherPin = Number( otherController.pin );
        if( this.gpioPinsPrimary.includes( otherPin ) ) {
          pins = this.gpioPinsSecondary;
        } else if( this.gpioPinsSecondary.includes( otherPin ) ) {
          pins = this.gpioPinsPrimary;
        } else {
          pins = [];
        }
      }
      return pins.map( pin => ( { id: pin, name: `${pin}` } ) );
    }
  },
  methods: {
    stripIdKey( id ) {
      if( Array.isArray( id ) ) {
        return `${ id[0] }.${ id[1] }`;
      }
      if( Number.isFinite( Number( id ) ) ) {
        const strip = this.stripConfig?.[Number( id )];
        if( strip ) {
          return `${ strip.controller }.${ strip.controllerStripIndex }`;
        }
      }
      return "";
    },
    normalizeStripId( id ) {
      if( Array.isArray( id ) ) {
        const controllerIndex = Number( id[0] );
        const stripIndex = Number( id[1] );
        if( Number.isFinite( controllerIndex ) && Number.isFinite( stripIndex ) ) {
          return [controllerIndex, stripIndex];
        }
      }
      const flatIndex = Number( id );
      if( Number.isFinite( flatIndex ) ) {
        const strip = this.stripConfig?.[flatIndex];
        if( strip ) {
          return [strip.controller, strip.controllerStripIndex];
        }
      }
      return null;
    },
    isStripSelected( selectedStrips, stripId ) {
      const key = this.stripIdKey( stripId );
      if( !key ) {
        return false;
      }
      return ( selectedStrips || [] ).some( entry => this.stripIdKey( entry ) === key );
    },
    getStripById( stripId ) {
      const key = this.stripIdKey( stripId );
      if( !key ) {
        return null;
      }
      return this.stripConfig.find( strip => this.stripIdKey( strip.id ) === key ) || null;
    },
    getStripEntry( index ) {
      const strip = this.stripConfig?.[index];
      if( !strip ) {
        return null;
      }
      const controllerIndex = strip.controller;
      const controller = this.systemConfig?.controllers?.[controllerIndex];
      const controllerStripIndex = strip.controllerStripIndex;
      const controllerStrip = controller?.strips?.[controllerStripIndex];
      return {
        strip: controllerStrip || strip,
        controllerIndex,
        controllerStripIndex
      };
    },
    isWebSocketController( controller ) {
      return controller?.type === "WebSocket" || controller?.type === "ESP32";
    },
    controllerTypeName( controller ) {
      if( this.isWebSocketController( controller ) ) {
        return "WebSocket";
      }
      if( controller?.type === "Mock" ) {
        return "Mock";
      }
      return controller?.type || "Unknown";
    },
    controllerLabel( controller, index ) {
      if( index === null || index === undefined ) {
        return "Unassigned";
      }
      const name = controller?.name?.trim();
      if( name ) {
        return name;
      }
      if( controller?.type === "GPIO" ) {
        return `GPIO ${controller?.pin ?? index}`;
      }
      if( this.isWebSocketController( controller ) ) {
        return controller?.url ? `WebSocket ${controller.url}` : "WebSocket";
      }
      return `Controller ${index}`;
    },
    otherGpioController() {
      return ( this.systemConfig?.controllers || [] )
          .find( ( controller, index ) => controller?.type === "GPIO" && index !== this.editControllerIndex );
    },
    normalizeControllerType( controller ) {
      if( this.isWebSocketController( controller ) ) {
        return { ...controller, type: "WebSocket" };
      }
      return controller;
    },
    normalizeControllers( controllers ) {
      const controllersWithIndex = controllers.map( ( controller, index ) => ( {
        controller: this.normalizeControllerType( controller ),
        originalIndex: index
      } ) );
      const gpioControllers = controllersWithIndex.filter( entry => entry.controller?.type === "GPIO" );
      if( gpioControllers.length > 2 ) {
        return { error: "Only 2 GPIO controllers can be used." };
      }
      if( gpioControllers.length === 1 ) {
        const pin = Number( gpioControllers[0].controller?.pin );
        if( !this.gpioPinsSingle.includes( pin ) ) {
          return { error: "GPIO pin must be one of the supported single-pin channels." };
        }
        return { controllers: controllersWithIndex.map( entry => entry.controller ) };
      }
      if( gpioControllers.length === 2 ) {
        const primary = gpioControllers.find( entry => this.gpioPinsPrimary.includes( Number( entry.controller?.pin ) ) );
        const secondary = gpioControllers.find( entry => this.gpioPinsSecondary.includes( Number( entry.controller?.pin ) ) );
        if( !primary || !secondary ) {
          return { error: "GPIO pins must use one primary and one secondary pin when two controllers are set." };
        }
        const insertIndex = Math.min( primary.originalIndex, secondary.originalIndex );
        const remaining = controllersWithIndex.filter( entry => entry !== primary && entry !== secondary );
        const insertAt = remaining.findIndex( entry => entry.originalIndex > insertIndex );
        const ordered = [primary, secondary];
        let reordered = [];
        if( insertAt === -1 ) {
          reordered = remaining.concat( ordered );
        } else {
          reordered = remaining.slice( 0, insertAt ).concat( ordered, remaining.slice( insertAt ) );
        }
        return { controllers: reordered.map( entry => entry.controller ) };
      }
      return { controllers: controllersWithIndex.map( entry => entry.controller ) };
    },
    ensureGpioPinSelection() {
      if( this.controllerModal.type !== "GPIO" ) {
        return;
      }
      const options = this.gpioPinOptions;
      if( options.length === 0 ) {
        this.controllerModal.pin = "";
        return;
      }
      const current = Number( this.controllerModal.pin );
      if( !options.some( option => Number( option.id ) === current ) ) {
        this.controllerModal.pin = options[0].id;
      }
    },
    featureLabel( key ) {
      return this.featureLabels[key] || key;
    },
    jumpTo( section ) {
      const element = document.getElementById( `${section}-section` );
      if( element ) {
        element.scrollIntoView( { behavior: 'smooth', block: 'start' } );
      }
    },
    saveFeatures() {
      if( this.systemConfig?.features ) {
        this.saveKey( 'features', this.systemConfig.features );
      }
    },
    saveHomekit() {
      if( this.systemConfig?.homekit ) {
        this.saveKey( 'homekit', this.systemConfig.homekit );
      }
    },
    serviceSupportsHueAndSat( service ) {
      return Boolean( service?.hueAndSat );
    },
    getHomekitServices( accessory ) {
      if( !accessory ) {
        return [];
      }
      return accessory.services || [];
    },
    setHomekitServices( accessory, services ) {
      accessory.services = services;
    },
    openHomekitAccessoryModal( index = null ) {
      this.editHomekitAccessoryIndex = index;
      const config = index !== null && index !== undefined
          ? this.systemConfig?.homekit?.[index]
          : null;
      this.homekitAccessoryModal = {
        name: config?.name || "",
        transitionSelection: {
          id: config?.transition || 'none',
          options: config?.transitionOptions || {}
        }
      };
      this.$refs.homekitAccessoryModal.open()
          .catch( () => {
          } );
    },
    saveHomekitAccessory() {
      const name = this.homekitAccessoryModal.name?.trim();
      if( !name ) {
        window.alert( "HomeKit instance name is required." );
        return false;
      }
      if( !this.systemConfig.homekit ) {
        this.systemConfig.homekit = [];
      }
      const accessories = this.systemConfig.homekit.slice();
      const index = this.editHomekitAccessoryIndex;
      const isEdit = index !== null && index !== undefined;
      const existing = isEdit ? accessories[index] : null;
      const transitionSelection = this.homekitAccessoryModal.transitionSelection || {};
      const transitionId = transitionSelection.id || 'none';
      const transitionOptions = transitionSelection.options || {};
      const accessory = {
        ...( existing || {} ),
        name,
        services: this.getHomekitServices( existing ).slice(),
        transition: transitionId,
        transitionOptions
      };
      if( isEdit ) {
        accessories.splice( index, 1, accessory );
      } else {
        accessories.push( accessory );
      }
      this.systemConfig.homekit = accessories;
      this.saveHomekit();
      return true;
    },
    submitHomekitAccessoryModal() {
      if( this.saveHomekitAccessory() ) {
        this.$refs.homekitAccessoryModal.internalClose();
      }
    },
    deleteHomekitAccessory() {
      const index = this.editHomekitAccessoryIndex;
      if( index === null || index === undefined ) {
        return;
      }
      if( !window.confirm( "Delete this HomeKit accessory?" ) ) {
        return;
      }
      const accessories = ( this.systemConfig.homekit || [] ).slice();
      accessories.splice( index, 1 );
      this.systemConfig.homekit = accessories;
      this.saveHomekit();
      this.$refs.homekitAccessoryModal.internalClose();
    },
    openHomekitServiceModal( accessoryIndex, serviceIndex = null ) {
      this.editHomekitServiceAccessoryIndex = accessoryIndex;
      this.editHomekitServiceIndex = serviceIndex;
      const accessory = this.systemConfig?.homekit?.[accessoryIndex];
      if( !accessory ) {
        window.alert( "HomeKit instance not found." );
        return;
      }
      const service = serviceIndex !== null && serviceIndex !== undefined
          ? this.getHomekitServices( accessory )[serviceIndex]
          : null;
      this.homekitServiceModal = {
        name: service?.name || "",
        strips: Array.isArray( service?.strips ) ? service.strips.slice() : [],
        temperature: Boolean( service?.temperature ),
        hueAndSat: Boolean( service?.hueAndSat ),
        type: service?.type || "light"
      };
      this.$refs.homekitServiceModal.open()
          .catch( () => {
          } );
    },
    toggleHomekitStrip( stripIndex, enabled ) {
      const strips = this.homekitServiceModal.strips.slice();
      const key = this.stripIdKey( stripIndex );
      const index = strips.findIndex( entry => this.stripIdKey( entry ) === key );
      if( enabled && index === -1 ) {
        strips.push( stripIndex );
      }
      if( !enabled && index !== -1 ) {
        strips.splice( index, 1 );
      }
      this.homekitServiceModal.strips = strips;
    },
    saveHomekitService() {
      const name = this.homekitServiceModal.name?.trim();
      if( !name ) {
        window.alert( "Service name is required." );
        return false;
      }
      const accessoryIndex = this.editHomekitServiceAccessoryIndex;
      const accessory = this.systemConfig?.homekit?.[accessoryIndex];
      if( !accessory ) {
        window.alert( "HomeKit instance not found." );
        return false;
      }
      const services = this.getHomekitServices( accessory ).slice();
      const uniqueStrips = [];
      const seen = new Set();
      this.homekitServiceModal.strips.forEach( value => {
        const normalized = this.normalizeStripId( value );
        if( !normalized ) {
          return;
        }
        const key = this.stripIdKey( normalized );
        if( !key || seen.has( key ) ) {
          return;
        }
        seen.add( key );
        uniqueStrips.push( normalized );
      } );
      const temperature = Boolean( this.homekitServiceModal.temperature );
      const hueAndSat = Boolean( this.homekitServiceModal.hueAndSat );
      const index = this.editHomekitServiceIndex;
      const isEdit = index !== null && index !== undefined;
      const existing = isEdit ? services[index] : null;
      const service = {
        ...( existing || {} ),
        name,
        strips: uniqueStrips,
        temperature,
        hueAndSat,
        type: existing?.type || this.homekitServiceModal.type || "light"
      };
      if( service.hue ) {
        delete service.hue;
      }
      if( service.saturation ) {
        delete service.saturation;
      }
      if( isEdit ) {
        services.splice( index, 1, service );
      } else {
        services.push( service );
      }
      this.setHomekitServices( accessory, services );
      this.saveHomekit();
      return true;
    },
    submitHomekitServiceModal() {
      if( this.saveHomekitService() ) {
        this.$refs.homekitServiceModal.internalClose();
      }
    },
    deleteHomekitService() {
      const accessoryIndex = this.editHomekitServiceAccessoryIndex;
      const serviceIndex = this.editHomekitServiceIndex;
      if( accessoryIndex === null || accessoryIndex === undefined ) {
        return;
      }
      if( serviceIndex === null || serviceIndex === undefined ) {
        return;
      }
      if( !window.confirm( "Delete this HomeKit service?" ) ) {
        return;
      }
      const accessory = this.systemConfig?.homekit?.[accessoryIndex];
      const services = this.getHomekitServices( accessory ).slice();
      if( !services.length ) {
        return;
      }
      services.splice( serviceIndex, 1 );
      this.setHomekitServices( accessory, services );
      this.saveHomekit();
      this.$refs.homekitServiceModal.internalClose();
    },
    saveKey( key, data ) {
      if( this.socket ) {
        this.socket.emit( 'setSettings', key, data );
      }
    },
    reloadScripts() {
      if( this.socket ) {
        this.socket.emit( 'reloadScripts', ( data ) => {
          this.ledScripts = data;
        } );
      }
    },
    openStripModal( index = null ) {
      this.editStripIndex = index;
      if( index !== null && index !== undefined ) {
        const entry = this.getStripEntry( index );
        const strip = entry?.strip;
        this.stripModal = {
          name: strip.name,
          length: strip.length,
          type: strip.type,
          controller: entry?.controllerIndex ?? 0
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
          .catch( () => {
          } );
    },
    saveStrip() {
      const name = this.stripModal.name?.trim();
      const length = Number( this.stripModal.length );
      const type = this.stripModal.type;
      const controller = Number( this.stripModal.controller );
      if( !this.controllerOptions.length ) {
        window.alert( "You must create a controller first." );
        return false;
      }
      if( !name || !length || !type || Number.isNaN( controller ) ) {
        window.alert( "You are missing something!" );
        return false;
      }
      if( controller < 0 || controller >= this.controllerOptions.length ) {
        window.alert( "Please select a controller." );
        return false;
      }
      const index = this.editStripIndex;
      const isEdit = index !== null && index !== undefined;
      const controllers = this.systemConfig.controllers || [];
      const targetController = controllers[controller];
      if( !targetController ) {
        window.alert( "Please select a controller." );
        return false;
      }
      if( !targetController.strips ) {
        targetController.strips = [];
      }
      if( isEdit ) {
        const entry = this.getStripEntry( index );
        if( !entry ) {
          window.alert( "Strip not found." );
          return false;
        }
        const updatedStrip = {
          ...entry.strip,
          name,
          length,
          type
        };
        if( entry.controllerIndex === controller ) {
          controllers[entry.controllerIndex].strips.splice( entry.controllerStripIndex, 1, updatedStrip );
        } else {
          controllers[entry.controllerIndex].strips.splice( entry.controllerStripIndex, 1 );
          targetController.strips.push( updatedStrip );
        }
      } else {
        targetController.strips.push( {
          name,
          length,
          type
        } );
      }
      this.saveKey( 'controllers', controllers );
      return true;
    },
    submitStripModal() {
      if( this.saveStrip() ) {
        this.$refs.scriptModal.internalClose();
      }
    },
    openControllerModal( index = null ) {
      this.editControllerIndex = index;
      if( index !== null && index !== undefined ) {
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
          .catch( () => {
          } );
    },
    saveController() {
      const name = this.controllerModal.name?.trim();
      const type = this.controllerModal.type;
      const url = this.controllerModal.url?.trim();
      const pin = Number( this.controllerModal.pin );
      if( !name || !type ) {
        window.alert( "You are missing something!" );
        return false;
      }
      if( type === "WebSocket" && !url ) {
        window.alert( "Controller URL is required." );
        return false;
      }
      if( type === "GPIO" && ( !pin || Number.isNaN( pin ) ) ) {
        window.alert( "Controller pin is required." );
        return false;
      }
      const existingController = this.editControllerIndex !== null && this.editControllerIndex !== undefined
          ? this.systemConfig.controllers?.[this.editControllerIndex]
          : null;
      const controller = {
        name,
        type,
        ...( type === "WebSocket" ? { url } : {} ),
        ...( type === "GPIO" ? { pin } : {} ),
        strips: existingController?.strips ? existingController.strips.slice() : []
      };
      const index = this.editControllerIndex;
      const isEdit = index !== null && index !== undefined;
      if( !this.systemConfig.controllers ) {
        this.systemConfig.controllers = [];
      }
      const controllers = this.systemConfig.controllers.slice();
      if( isEdit ) {
        controllers.splice( index, 1, controller );
      } else {
        controllers.push( controller );
      }
      const normalized = this.normalizeControllers( controllers );
      if( normalized.error ) {
        window.alert( normalized.error );
        return false;
      }
      const updatedControllers = normalized.controllers || controllers;
      this.systemConfig.controllers = updatedControllers;
      this.saveKey( 'controllers', this.systemConfig.controllers );
      return true;
    },
    submitControllerModal() {
      if( this.saveController() ) {
        this.$refs.controllerModal.internalClose();
      }
    },
    deleteController() {
      const index = this.editControllerIndex;
      if( index === null || index === undefined ) {
        return;
      }
      const hasAttachedStrips = ( this.systemConfig.controllers?.[index]?.strips || [] ).length > 0;
      if( hasAttachedStrips ) {
        window.alert( "This controller still has strips attached." );
        return;
      }
      const controllers = ( this.systemConfig.controllers || [] ).slice();
      controllers.splice( index, 1 );
      const normalized = this.normalizeControllers( controllers );
      if( normalized.error ) {
        window.alert( normalized.error );
        return;
      }
      const updatedControllers = normalized.controllers || controllers;
      this.systemConfig.controllers = updatedControllers;
      this.saveKey( 'controllers', this.systemConfig.controllers );
      this.$refs.controllerModal.internalClose();
    },
    deleteStrip( index ) {
      const entry = this.getStripEntry( index );
      if( !entry ) {
        return;
      }
      const controller = this.systemConfig.controllers?.[entry.controllerIndex];
      if( !controller?.strips ) {
        return;
      }
      controller.strips.splice( entry.controllerStripIndex, 1 );
      this.saveKey( 'controllers', this.systemConfig.controllers );
    },
    openModifierModal( index ) {
      const entry = this.getStripEntry( index );
      const strip = entry?.strip;
      if( !strip ) {
        return;
      }
      this.modifierModal.stripIndex = index;
      this.modifierModal.controllerIndex = entry.controllerIndex;
      this.modifierModal.controllerStripIndex = entry.controllerStripIndex;
      this.modifierModal.selected = strip.modifier || "";
      this.modifierModal.existingValues = strip.modifierOptions || {};
      this.updateModifierOptions();
      this.$refs.modifierModal.open()
          .then( () => this.saveModifier() )
          .catch( () => {
          } );
    },
    updateModifierOptions() {
      const modifier = this.modifierModal.selected;
      if( !modifier ) {
        this.modifierModal.options = [];
        return;
      }
      const modifierObj = this.ledScripts?.modifiers?.[modifier];
      if( !modifierObj ) {
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
      const controller = this.systemConfig.controllers?.[this.modifierModal.controllerIndex];
      const strip = controller?.strips?.[this.modifierModal.controllerStripIndex];
      if( !strip ) {
        return;
      }
      strip.modifier = this.modifierModal.selected || undefined;
      let modifierOptions = {};
      if( strip.modifier ) {
        this.modifierModal.options.forEach( option => {
          let value = option.value;
          if( option.type === 'number' ) {
            value = Number( value );
          }
          modifierOptions[option.id] = value;
        } );
      }
      strip.modifierOptions = modifierOptions;
      this.saveKey( 'controllers', this.systemConfig.controllers );
    },
    stripsForService( service ) {
      const strips = Array.isArray( service?.strips ) ? service.strips : [];
      return strips.map( stripId => {
        const strip = this.getStripById( stripId );
        const key = this.stripIdKey( stripId );
        if( !strip ) {
          return {
            id: stripId,
            key: key || `${ stripId }`,
            name: `Strip ${key || stripId}`,
            type: "strip"
          };
        }
        return {
          id: stripId,
          key,
          ...strip
        };
      } );
    },
    buttonStrips( config ) {
      const strips = ( config.strips || [] ).slice();
      const matrixKey = this.stripIdKey( this.displayMatrix?.strip );
      if( config.matrix && matrixKey && !strips.some( entry => this.stripIdKey( entry ) === matrixKey ) ) {
        strips.unshift( this.displayMatrix.strip );
      }
      return strips.map( stripId => ( {
        id: stripId,
        key: this.stripIdKey( stripId ),
        ...( this.getStripById( stripId ) || {} )
      } ) );
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
      if( !value ) {
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
        switch( option.type ) {
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
    this.socket = getSocket();
    this.socketConnectHandler = () => {
      this.socket.emit( 'getSettings', ( data ) => {
        this.systemConfig = data;
        this.socket.emit( 'getLEDScripts', ( scripts ) => {
          this.ledScripts = scripts;
          if( this.showMatrix ) {
            this.socket.emit( 'getMatrixScripts', ( matrix ) => {
              this.matrixScripts = matrix;
            } );
          }
        } );
      } );
    };
    this.socket.on( 'connect', this.socketConnectHandler );
    if( this.socket.connected ) {
      this.socketConnectHandler();
    }
  },
  beforeUnmount() {
    if( this.socket && this.socketConnectHandler ) {
      this.socket.off( 'connect', this.socketConnectHandler );
    }
  }
}
</script>
