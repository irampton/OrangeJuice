<template>
  <section class="section live-view">
    <div v-if="systemConfig && !controllers.length" class="empty-state">No controllers attached.</div>
    <div
        v-for="(controller, controllerIndex) in controllers"
        :key="controller.name || controllerIndex"
        class="controller-block"
    >
      <h2 class="controller-title">
        {{ controllerLabel( controller, controllerIndex ) }}
      </h2>
      <div
          v-for="(strip, stripIndex) in (controller.strips || [])"
          :key="strip.name || stripIndex"
          class="strip-block"
      >
        <h3 class="strip-title">
          {{ stripLabel( strip, stripIndex ) }}
        </h3>
        <div class="pixel-grid">
          <div
              v-for="pixelIndex in pixelArray(strip.length)"
              :key="pixelIndex"
              class="pixel-box"
              :style="pixelStyle(controllerIndex, stripIndex, pixelIndex)"
          ></div>
        </div>
      </div>
    </div>
  </section>
</template>

<script>
import { getSocket } from "@/socket";

export default {
  name: "LiveView",
  data() {
    return {
      socket: undefined,
      socketConnectHandler: undefined,
      systemConfig: null,
      liveViewInterval: null,
      liveViewColors: {},
      liveViewHandler: undefined
    };
  },
  computed: {
    controllers() {
      return this.systemConfig?.controllers || [];
    }
  },
  methods: {
    controllerLabel( controller, index ) {
      return controller?.name || controller?.type || `Controller ${index + 1}`;
    },
    stripLabel( strip, index ) {
      return strip?.name || `Strip ${index + 1}`;
    },
    pixelArray( length ) {
      const count = Number( length ) || 0;
      return Array.from( { length: count }, ( _, index ) => index );
    },
    enableLiveView() {
      if( this.socket ) {
        this.socket.emit( "enableLiveView" );
      }
    },
    handleLiveViewUpdate( payload ) {
      if( !payload ) {
        return;
      }
      const { controllerIndex, colors } = payload;
      if( controllerIndex === undefined ) {
        return;
      }
      this.liveViewColors = {
        ...this.liveViewColors,
        [controllerIndex]: colors || []
      };
    },
    stripOffset( controller, stripIndex ) {
      if( !controller?.strips?.length ) {
        return 0;
      }
      return controller.strips
          .slice( 0, stripIndex )
          .reduce( ( sum, strip ) => sum + ( Number( strip.length ) || 0 ), 0 );
    },
    pixelStyle( controllerIndex, stripIndex, pixelIndex ) {
      const controller = this.controllers?.[controllerIndex];
      const offset = this.stripOffset( controller, stripIndex );
      const colors = this.liveViewColors?.[controllerIndex] || [];
      const color = colors[offset + pixelIndex];
      let hex = "000000";
      if( typeof color === "number" && Number.isFinite( color ) ) {
        hex = color.toString( 16 ).padStart( 6, "0" );
      } else if( typeof color === "string" ) {
        hex = color.padStart( 6, "0" );
      }
      return { backgroundColor: `#${hex}` };
    }
  },
  created() {
    this.socket = getSocket();
    this.socketConnectHandler = () => {
      this.socket.emit( "getSettings", ( data ) => {
        this.systemConfig = data;
      } );
    };
    this.socket.on( "connect", this.socketConnectHandler );
    if( this.socket.connected ) {
      this.socketConnectHandler();
    }
    this.liveViewHandler = ( payload ) => this.handleLiveViewUpdate( payload );
    this.socket.on( "liveViewUpdate", this.liveViewHandler );
    this.enableLiveView();
    this.liveViewInterval = setInterval( () => {
      this.enableLiveView();
    }, 5000 );
  },
  beforeUnmount() {
    if( this.socket && this.socketConnectHandler ) {
      this.socket.off( "connect", this.socketConnectHandler );
    }
    if( this.socket && this.liveViewHandler ) {
      this.socket.off( "liveViewUpdate", this.liveViewHandler );
    }
    if( this.liveViewInterval ) {
      clearInterval( this.liveViewInterval );
    }
  }
};
</script>

<style scoped>
.live-view {
  background-color: #000;
  color: #fff;
  min-height: 100vh;
  padding-top: 0;
}

.empty-state {
  font-size: 1.2rem;
  padding: 2rem 1rem;
}

.controller-block {
  margin-bottom: 2.5rem;
}

.controller-title {
  font-size: 2rem;
  margin-bottom: 1rem;
}

.strip-block {
  margin-bottom: 1.5rem;
}

.strip-title {
  font-size: 1.4rem;
  margin: 1rem 0 0.75rem;
}

.pixel-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 20px;
}

.pixel-box {
  width: 50px;
  height: 50px;
  border: 1px solid #fff;
  background-color: #000;
  border-radius: 16px;
  box-sizing: border-box;
}
</style>
