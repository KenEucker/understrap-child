var Loader = require('halogen/PulseLoader');
var loaderComponent = React.createClass({
  render: function() {
    return (
      <Loader color="#26A65B" size="16px" margin="4px"/>
    );
  }
});

ReactDOM.render(loaderComponent, document.getElementById('root'));