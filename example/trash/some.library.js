define("lib", {
    capitalize: function(name) {
        return (name ? name.substr(0, 1).toUpperCase() + name.substr(1) : "where is the name?");
    }
})